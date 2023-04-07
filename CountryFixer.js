let args = process.argv.slice(2);
const turf = require("@turf/turf");
const fs = require("fs");

let country = args[0];
let simplify = Number(args[1]) || false;

let co_features = JSON.parse(
  fs.readFileSync(`./movc/geo/countries/countries/${country}.geojson`)
);

let nonPoly = co_features.features.filter(
  (v) => !v.geometry.type.endsWith("Polygon")
);

nonPoly = nonPoly.map((v) => {
  if (v.properties.type === "landmark") {
    v.properties.type = "landmark-0";
  }

  if (!v.properties.type) {
    v.properties.type = "city";
  }

  return v;
});

let polygons = co_features.features.filter((v) =>
  v.geometry.type.endsWith("Polygon")
);
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

polygons = turf.dissolve(turf.featureCollection(polygons), {
  propertyName: "some-undefined-value",
});

if (simplify !== false) {
  polygons = turf.simplify(polygons, {
    tolerance: simplify,
    highQuality: true,
  });
}

polygons.features = polygons.features.map((v) => {
  v.properties = {
    name: v.properties.name,
    fill: props[v.properties.name].fill,
    stroke: props[v.properties.name].stroke,
    type: props[v.properties.name].type,
    tags: props[v.properties.name].tags,
  };
  return v;
});

polygons.features = polygons.features.concat(nonPoly);

console.log("done");
fs.writeFileSync(
  `./movc/geo/countries/countries/${country}.geojson`,
  JSON.stringify(polygons, null, "  ")
);
