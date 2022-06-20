const turf = require("@turf/turf");
const fs = require("fs");

let layers = JSON.parse(fs.readFileSync("./geo/newmap/layers.json", "utf-8"));
let colors = JSON.parse(fs.readFileSync("./geo/newmap/colors.json", "utf-8"));

let features = [];

for (country of layers) {
  let co_features = JSON.parse(
    fs.readFileSync(`./geo/newmap/countries/${country}.geojson`, "utf-8")
  ).features;
  let color = colors[country];

  features = [
    ...features,
    ...co_features.map((val) => {
      val.properties.name = country;
      val.properties.fill = color;
      val.properties.stroke = color;

      return val;
    }),
  ];
}

let geo = {
  type: "FeatureCollection",
  features: features.reverse(),
};

//JSON.parse(fs.readFileSync("./geo/geo.geojson", "utf-8"));

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
        geo.features[i]?.geometry.type !== "Polygon" ||
        geo.features[i]?.properties.type === "sand" ||
        geo.features[i]?.properties.type === "water" ||
        geo.features[i]?.properties.type === "grass" ||
        geo.features[g]?.properties.type === "sand" ||
        geo.features[g]?.properties.type === "water" ||
        geo.features[g]?.properties.type === "grass"
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

// console.log("MultiPolygon reshape");
// console.time("Multi Reshape");
// for (let i = 0; i < geo.features.length; i++) {
//   if (geo.features[i].geometry.type === "MultiPolygon") {
//     let totalArr = [[]];
//     for (let arr of geo.features[i].geometry.coordinates[0]) {
//       totalArr[0] = totalArr[0].concat(arr);
//     }
//     geo.features[i].geometry.type = "Polygon";
//     geo.features[i].geometry.coordinates = totalArr;
//   }
// }
// console.timeEnd("Multi Reshape");
// console.log();

fs.writeFileSync("./geo/newmap.geojson", JSON.stringify(geo, null, "  "));

console.timeEnd("Total");
