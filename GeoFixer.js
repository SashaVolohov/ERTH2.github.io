const turf = require("@turf/turf");
const fs = require("fs");
const { getSystemErrorMap } = require("util");
let geo = JSON.parse(fs.readFileSync("./geo/geo.geojson", "utf-8"));

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
    // console.log(g, i);
    try {
      if (
        geo.features[g] === geo.features[i] ||
        geo.features[g]?.geometry.type !== "Polygon" ||
        geo.features[i]?.geometry.type !== "Polygon"
      ) {
        continue;
      }
      let p1 = turf.polygon(
        geo.features[g].geometry.coordinates,
        geo.features[g].properties
      );
      let p2 = turf.polygon(
        geo.features[i].geometry.coordinates,
        geo.features[i].properties
      );
      let diff = turf.difference(p1, p2);
      geo.features[g] = diff ? diff : geo.features[g];
    } catch {
      console.log("Error, skip");
    }
  }
}
console.timeEnd("Difference");
console.log();

console.log("MultiPolygon reshape");
console.time("Multi Reshape");
for (let i = 0; i < geo.features.length; i++) {
  if (geo.features[i].geometry.type === "MultiPolygon") {
    let totalArr = [[]];
    for (let arr of geo.features[i].geometry.coordinates[0]) {
      totalArr[0] = totalArr[0].concat(arr);
    }
    geo.features[i].geometry.type = "Polygon";
    geo.features[i].geometry.coordinates = totalArr;
  }
}
console.timeEnd("Multi Reshape");
console.log();

fs.writeFileSync("./geo/geo.geojson", JSON.stringify(geo, null, "  "));

console.timeEnd("Total");
