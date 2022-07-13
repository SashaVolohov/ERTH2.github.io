const turf = require("@turf/turf");
const fs = require("fs");

let layers = JSON.parse(
  fs.readFileSync("./movc/geo/countries/layers.json", "utf-8")
);
let colors = JSON.parse(
  fs.readFileSync("./movc/geo/countries/colors.json", "utf-8")
);

let features = [];

for (country of layers) {
  let co_features = JSON.parse(
    fs.readFileSync(
      `./movc/geo/countries/countries/${country}.geojson`,
      "utf-8"
    )
  ).features;
  let color = colors[country];

  features = [
    ...features,
    ...co_features.map((val) => {
      if (val.geometry.type == "Polygon") {
        val.properties.name = country;
        val.properties.fill = color;
        val.properties.stroke = color;
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
  };
  return v;
});
geo.features = nonPoly.concat(dissolved.features);
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

fs.writeFileSync("./movc/geo/geo.geojson", JSON.stringify(geo, null, "  "));

console.timeEnd("Total");
