const turf = require("@turf/turf");
const fs = require("fs");
const YAML = require("yaml");
const _ = require("lodash");

let layers = YAML.parse(
  fs.readFileSync("./movc/geo/countries/layers.yaml", "utf-8")
);
let countries_properties = YAML.parse(
  fs.readFileSync("./movc/geo/countries/properties.yaml", "utf-8")
);
let config = YAML.parse(
  fs.readFileSync("./movc/geo/countries/config.yaml", "utf-8")
);

let features = [];

for (country of layers) {
  let properties = countries_properties[country];

  let co_features = JSON.parse(
    fs.readFileSync(
      `./movc/geo/countries/countries/${country}.geojson`,
      "utf-8"
    )
  ).features;

  features = [
    ...features,
    ...co_features.map((val) => {
      if (val.geometry.type == "Polygon") {
        val.properties = properties;
        val.properties.name = country;
      }

      return val;
    }),
  ];
}

let geo = {
  type: "FeatureCollection",
  features: features.reverse(),
};

geo.features = geo.features.filter((v) => v.properties.name);

console.time("Total");

console.log("Dissolve");
console.time("Dissolve");
let nonPoly = geo.features.filter((v) => !v.geometry.type.endsWith("Polygon"));
let polygons = geo.features.filter((v) => v.geometry.type.endsWith("Polygon"));
let props = {};

for (let feature of polygons) {
  if (props[feature.properties.name]) continue;
  props[feature.properties.name] = {
    stroke: feature.properties.stroke,
    fill: feature.properties.fill,
    type: feature.properties.type,
    tags: feature.properties.tags,
  };
}

let dissolved = turf.dissolve(turf.featureCollection(polygons), {
  propertyName: "name",
});

dissolved.features = dissolved.features.map((v) => {
  v.properties = {
    name: v.properties.name,
    fill: props[v.properties.name].fill,
    stroke: props[v.properties.name].stroke,
    type: props[v.properties.name].type,
    tags: props[v.properties.name].tags,
  };
  return v;
});
geo.features = dissolved.features.concat(nonPoly);
console.timeEnd("Dissolve");
console.log();

console.log("Difference");
console.time("Difference");
for (let g = 0; g < geo.features.length; g++) {
  for (let i = 0; i < geo.features.length; i++) {
    try {
      if (
        geo.features[g] === geo.features[i] ||
        geo.features[i]?.properties.type === "sand" ||
        geo.features[i]?.properties.type === "water" ||
        geo.features[i]?.properties.type === "grass" ||
        geo.features[g]?.properties.type === "sand" ||
        geo.features[g]?.properties.type === "water" ||
        geo.features[g]?.properties.type === "grass"
      ) {
        continue;
      }

      if (
        (geo.features[g]?.geometry.type === "Polygon" ||
          geo.features[g]?.geometry.type === "MultiPolygon") &&
        (geo.features[i]?.geometry.type === "Polygon" ||
          geo.features[i]?.geometry.type === "MultiPolygon")
      ) {
        let p1 =
          geo.features[g]?.geometry.type === "MultiPolygon"
            ? turf.multiPolygon(
                geo.features[g].geometry.coordinates,
                geo.features[g].properties
              )
            : turf.polygon(
                geo.features[g].geometry.coordinates,
                geo.features[g].properties
              );
        let p2 =
          geo.features[i]?.geometry.type === "MultiPolygon"
            ? turf.multiPolygon(
                geo.features[i].geometry.coordinates,
                geo.features[i].properties
              )
            : turf.polygon(
                geo.features[i].geometry.coordinates,
                geo.features[i].properties
              );

        let diff = turf.difference(p1, p2);
        geo.features[g] = diff ? diff : geo.features[g];
      } else continue;
    } catch (e) {
      console.log("Error, skip \n", e, "\n");
    }
  }
}
console.timeEnd("Difference");
console.log();

console.log("Add Map Components");
console.time("Add Map Components");

let sand = JSON.parse(
  fs.readFileSync("./movc/geo/nature/sand.geojson", "utf-8")
).features;

let water = JSON.parse(
  fs.readFileSync("./movc/geo/nature/water.geojson", "utf-8")
).features;

let grass = JSON.parse(
  fs.readFileSync("./movc/geo/nature/grass.geojson", "utf-8")
).features;

let white_road = JSON.parse(
  fs.readFileSync("./movc/geo/roads/white.geojson", "utf-8")
).features;

let orange_road = JSON.parse(
  fs.readFileSync("./movc/geo/roads/orange.geojson", "utf-8")
).features;

let yellow_road = JSON.parse(
  fs.readFileSync("./movc/geo/roads/yellow.geojson", "utf-8")
).features;

let road_sizes = JSON.parse(
  fs.readFileSync("./movc/geo/roads/sizes.json", "utf-8")
);

let map_comps = [
  ...water.map((val) => {
    val.properties.type = "water";
    val.properties.fill = "#75cff0";
    val.properties.stroke = "#75cff0";
    return val;
  }),
  ...sand.map((val) => {
    val.properties.type = "sand";
    val.properties.fill = "#efe9e1";
    val.properties.stroke = "#efe9e1";
    return val;
  }),
  ...grass.map((val) => {
    val.properties.type = "grass";
    val.properties.fill = "#d1e6be";
    val.properties.stroke = "#d1e6be";
    return val;
  }),
  ...white_road.map((val) => {
    let total = turf.buffer(
      val,
      road_sizes[val.properties.type] || road_sizes["middle"]
    );
    total.properties.type = "white_road";
    return total;
  }),
  ...yellow_road.map((val) => {
    let total = turf.buffer(
      val,
      road_sizes[val.properties.type] || road_sizes["middle"]
    );
    total.properties.type = "yellow_road";
    return total;
  }),
  ...orange_road.map((val) => {
    let total = turf.buffer(
      val,
      road_sizes[val.properties.type] || road_sizes["big"]
    );
    total.properties.type = "orange_road";
    return total;
  }),
];

map_comps = turf.dissolve(turf.featureCollection(map_comps), {
  propertyName: "type",
});

geo.features = [...map_comps.features, ...geo.features];
console.timeEnd("Add Map Components");
console.log();

if (config?.tags) {
  console.log("Filter countries by tags");
  console.time("Filter countries by tags");

  geo.features = geo.features.filter((val) => {
    if (_.intersection(config.tags, val.properties.tags).length === 0)
      return false;
    // else if (config?.cities == false && val.geometry.type === "Point")
    //   return false;
    else return true;
  });

  console.timeEnd("Filter countries by tag");
  console.log();
}

if (config?.reProperty) {
  console.log("replace Properties");
  console.time("replace Properties");

  geo.features = geo.features.map((val) => {
    val.properties = config.reProperty;
    return val;
  });

  console.timeEnd("replace Properties");
  console.log();
}

fs.writeFileSync("./movc/geo/geo.geojson", JSON.stringify(geo, null, "  "));

console.timeEnd("Total");
