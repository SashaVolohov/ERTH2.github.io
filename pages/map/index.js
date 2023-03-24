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
  let movc = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/artegoser/clfm612fg002601nlcika2018",
    center: [53.19, 41.28],
    zoom: 6,
    projection: "globe",
  });

  movc.on("load", async () => {
    movc.loadImage(
      "https://erth2.github.io/movc/icons/city.png",
      (error, image) => {
        if (error) throw error;
        movc.addImage(`city`, image);
      }
    );

    movc.loadImage(
      "https://erth2.github.io/movc/icons/capital.png",
      (error, image) => {
        if (error) throw error;
        movc.addImage(`capital-city`, image);
      }
    );

    movc.loadImage(
      "https://erth2.github.io/movc/icons/landmark.png",
      (error, image) => {
        if (error) throw error;
        movc.addImage(`landmark-0`, image);
      }
    );
    loginfo("Получаю карту");
    let geo = await fetch("https://erth2.github.io/movc/geo/geo.geojson"); //await fetch("/geo.geojson");
    loginfo("Получаю страны MOVC");
    let coarray = await fetch(
      "https://erth2.github.io/movc/geo/countries.json"
    );
    coarray = await coarray.json();
    let countries = {};
    for (let i = 0; i < coarray.length; i++)
      countries[coarray[i].idc] = coarray[i];
    geo = (await geo.json()).features;
    for (let i = 0; i < geo.length; i++) {
      function onEachFeature(feature, coordinates) {
        console.log(coordinates);
        if (feature.geometry.type === "Polygon")
          new mapboxgl.Popup()
            .setLngLat(coordinates)
            .setHTML(
              `
                <div class="row" style="padding: 5px;">
                        <div class="col-md-12 col-sm-12" style="padding: 0px;">
                                <img class="w-100" src="${country.img}" style="border-radius: 20px 20px 0px 0px;">
                        </div>
                        <div class="col-md-12 col-sm-12 text-center" style="border-radius: 0px 0px 20px 20px; background-color: rgb(231, 231, 231)">
                                <h5 class="card-title">
                                        ${country.name}
                                </a>
                                </h5>
                                <a href="${country.about}" class="btn btn-primary mb-2" style="color:white;border-radius: 20px;">Подробнее</a>
                        </div>
                </div>`
            )
            .addTo(movc);
        else if (feature.geometry.type === "Point") {
          new mapboxgl.Popup()
            .setLngLat(coordinates)
            .setHTML(
              `
                ${
                  feature?.properties?.amount
                    ? `<div class="row" style="padding: 5px; color: "white"; background-color: rgb(162, 162, 162);">Население - ${feature.properties.amount} чел.</div>`
                    : ""
                }
                <div class="row" style="padding: 5px;">
                  <div class="col-md-12 col-sm-12" style="padding: 0px;">
                    ${
                      feature?.properties?.img
                        ? `<img class="w-100" src="${feature.properties.img}" style="border-radius: 20px; margin-bottom: 5px" alt="${feature.properties.name} img">`
                        : ""
                    }
                  </div>
                  <div class="col-md-12 col-sm-12 text-center" style="border-radius: 20px; background-color: rgb(231, 231, 231)">
                    <h5 className="card-title">${feature.properties.name}</h5>
                    ${
                      feature.properties.description
                        ? `<div>${feature.properties.description}</div>`
                        : ""
                    }
                  </div>
                </div>
                `
            )
            .addTo(movc);
        }
      }
      if (geo[i].geometry.type == "Point") {
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

      let paint = {};
      let type = "";
      let layout = {};

      if (
        geo[i].geometry.type === "Polygon" ||
        geo[i].geometry.type === "MultiPolygon"
      ) {
        type = "fill";
        if (geo[i].properties.type === "sand") {
          paint = { "fill-color": "#efe9e1", "fill-opacity": 1 };
        } else if (geo[i].properties.type === "grass") {
          paint = { "fill-color": "#d1e6be", "fill-opacity": 1 };
        } else if (geo[i].properties.type === "water") {
          paint = { "fill-color": "#75cff0", "fill-opacity": 1 };
        } else {
          paint = { "fill-color": geo[i].properties.fill, "fill-opacity": 0.4 };
        }
      } else if (geo[i].geometry.type === "Point") {
        type = "symbol";

        layout = {
          "icon-image": `${geo[i].properties.type || "city"}`,
          "icon-size": 0.15,
        };
      }

      movc.addSource(`${i}`, {
        type: "geojson",
        data: geo[i],
      });
      movc.addLayer({
        id: `${i}`,
        type,
        source: `${i}`,
        paint,
        layout,
      });

      movc.on("mouseenter", `${i}`, () => {
        movc.getCanvas().style.cursor = "pointer";
      });

      movc.on("mouseleave", `${i}`, () => {
        movc.getCanvas().style.cursor = "";
      });

      movc.on("click", `${i}`, (e) => {
        const coordinates = e.lngLat;

        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
          coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }

        onEachFeature(e.features[0], coordinates);
      });
    }
  });
};
