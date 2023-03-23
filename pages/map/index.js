function loginfo(...str) {
  let info = str.shift();
  console.log(
    `%c ${info} `,
    "color:white; background-color: #78d6fa; border-radius:10px;",
    ...str
  );
}
function logmarker(...str) {
  let info = str.shift();
  console.log(
    `%c ${info} `,
    "color:white; background-color: #9300fc; border-radius:10px;",
    ...str
  );
}
function logland(...str) {
  let info = str.shift();
  console.log(
    `%c ${info} `,
    "color:white; background-color: #0c7700; border-radius:10px;",
    ...str
  );
}
function logoccupation(...str) {
  let info = str.shift();
  console.log(
    `%c ${info} `,
    "color:white; background-color: #B22222; border-radius:10px;",
    ...str
  );
}

function onMapClick(e) {
  loginfo("Даблклик", e.latlng.toString());
}

window.onload = async () => {
  mapboxgl.accessToken =
    "pk.eyJ1IjoiYXJ0ZWdvc2VyIiwiYSI6ImNrcDVhaHF2ejA2OTcyd3MxOG84bWRhOXgifQ.N3knNrPFIceTHVcIoPPcEQ";
  var movc = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/artegoser/clfl8oi21001901qgbc6zkyrw",
    center: [53.19, 41.28],
    zoom: 6,
    projection: "globe",
  });

  loginfo("Получаю карту");
  let geo = await fetch("https://erth2.github.io/movc/geo/geo.geojson"); //await fetch("/geo.geojson");
  loginfo("Получаю страны MOVC");
  let coarray = await fetch("https://erth2.github.io/movc/geo/countries.json");
  coarray = await coarray.json();
  let countries = {};
  for (let i = 0; i < coarray.length; i++)
    countries[coarray[i].idc] = coarray[i];
  geo = (await geo.json()).features;
  for (let i = 0; i < geo.length; i++) {
    function onEachFeature(feature, layer) {
      if (feature.geometry.type === "Polygon")
        if (feature.properties.type === "occupation") {
          layer.bindPopup(`
                <div class="row" style="padding: 5px;">
                        <div class="col-md-12 col-sm-12 text-center bordert" style="color:white;background-color:red;padding: 0px;">
                                Зона оккупации
                        </div>
                </div>
                <div class="row" style="padding: 5px;">
                        <div class="col-md-12 col-sm-12" style="padding: 0px;">
                                <img class="w-100" src="${
                                  country.img
                                }" style="border-radius: 20px 20px 0px 0px;">
                        </div>
                        <div class="col-md-12 col-sm-12 text-center" style="border-radius: 0px 0px 20px 20px; background-color: rgb(231, 231, 231)">
                                <h5 class="card-title">
                                        ${country.name}
                                        <a href="/erth2#marks">
                                ${
                                  country.verified === true
                                    ? `<svg id="completely" width="16" height="16" fill="currentColor" class="bi bi-check-circle-fill" viewBox="0 0 16 16"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"></path>
                                        <title>Соответствует стандартам ERTH2</title>
                                </svg>`
                                    : ""
                                }
                                </a>
                                </h5>
                                <a href="countries/${
                                  country.idc
                                }" class="btn btn-primary bordert mb-2" style="color:white;">Подробнее</a>
                        </div>
                </div>`);
        } else {
          layer.bindPopup(`
                <div class="row" style="padding: 5px;">
                        <div class="col-md-12 col-sm-12" style="padding: 0px;">
                                <img class="w-100" src="${
                                  country.img
                                }" style="border-radius: 20px 20px 0px 0px;">
                        </div>
                        <div class="col-md-12 col-sm-12 text-center" style="border-radius: 0px 0px 20px 20px; background-color: rgb(231, 231, 231)">
                                <h5 class="card-title">
                                        ${country.name}
                                        <a href="/erth2#marks">
                                ${
                                  country.verified === true
                                    ? `<svg id="completely" width="16" height="16" fill="currentColor" class="bi bi-check-circle-fill" viewBox="0 0 16 16"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"></path>
                                        <title>Соответствует стандартам ERTH2</title>
                                </svg>`
                                    : ""
                                }
                                </a>
                                </h5>
                                <a href="countries/${
                                  country.idc
                                }" class="btn btn-primary bordert mb-2" style="color:white;">Подробнее</a>
                        </div>
                </div>`);
        }
      else if (feature.geometry.type === "Point") {
        if (
          feature.properties.type === "city" ||
          feature.properties.type === "capital-city"
        ) {
          layer.bindPopup(`
                <h5 class="text-center">
                        ${feature.properties.name}
                </h5>
                Население:${
                  feature?.properties?.amount
                    ? feature.properties.amount
                    : "Не указано"
                }
        `);
        }
      }
    }
    function cpoint(feature, latlng) {
      if (feature.properties.type === "city" || !feature.properties.type) {
        let myIcon = mapboxgl.icon({
          iconSize: [12, 12],
          iconUrl: "https://static.movc.xyz/movc/icons/city.png",
        });
        return mapboxgl
          .marker(latlng, { icon: myIcon })
          .bindTooltip(feature.properties.name, {
            permanent: false,
            direction: "top",
          });
      } else if (feature.properties.type === "capital-city") {
        let myIcon = mapboxgl.icon({
          iconSize: [16, 16],
          iconUrl: "https://static.movc.xyz/movc/icons/capital.png",
        });
        return mapboxgl
          .marker(latlng, { icon: myIcon })
          .bindTooltip(feature.properties.name, {
            permanent: false,
            direction: "top",
          });
      } else if (feature.properties.type === "landmark") {
        let myIcon = mapboxgl.icon({
          iconSize: [16, 16],
          iconUrl: "https://static.movc.xyz/movc/icons/landmark.png",
        });
        return mapboxgl
          .marker(latlng, { icon: myIcon })
          .bindTooltip(feature.properties.name, {
            permanent: false,
            direction: "top",
          });
      }
      return mapboxgl.marker(latlng);
    }
    if (
      geo[i].properties.type === "city" ||
      geo[i].properties.type === "capital-city" ||
      geo[i].properties.type === "landmark" ||
      !geo[i].properties.type
    ) {
      logmarker(
        "Получаю маркер:",
        geo[i].properties.name || geo[i].properties.Name
      );
    } else if (
      geo[i].properties.type === "sand" ||
      geo[i].properties.type === "grass" ||
      geo[i].properties.type === "water"
    ) {
      logland(
        "Получаю кусок земли:",
        geo[i].properties.name || geo[i].properties.Name
      );
    } else if (geo[i].properties.type === "occupation") {
      logoccupation(
        "Получаю зону оккупации:",
        geo[i].properties.name || geo[i].properties.Name
      );
    } else {
      loginfo(
        "Получаю страну:",
        geo[i].properties.name || geo[i].properties.Name
      );
    }
    let country;
    if (geo[i].geometry.type === "Polygon") {
      country = countries[geo[i].properties.name];
      if (!country || !geo[i].properties.name) {
        if (
          ["sand", "grass", "water", "occupation"].indexOf(
            geo[i].properties.type
          ) === -1
        ) {
          console.error(
            "Ошибка в получении: " +
              (geo[i].properties.name || geo[i].properties.Name)
          );
          continue;
        }
      }
    }

    let style = {};

    if (geo[i].properties.type === "sand") {
      style = { "fill-color": "#efe9e1", "fill-opacity": 1 };
    } else if (geo[i].properties.type === "grass") {
      style = { "fill-color": "#d1e6be", "fill-opacity": 1 };
    } else if (geo[i].properties.type === "water") {
      style = { "fill-color": "#75cff0", "fill-opacity": 1 };
    } else {
      style = { "fill-color": geo[i].properties.fill, "fill-opacity": 0.4 };
    }

    movc.addSource(`${i}`, {
      type: "geojson",
      data: geo[i],
    });
    movc.addLayer({
      id: `${i}`,
      type: "fill",
      source: `${i}`,
      paint: style,
    });
  }
};
