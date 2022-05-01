const { parse } = require("csv-parse");
const planets = require('./planets.mongo');
const path = require("path");
const fs = require("fs");

function isHabitablePlanet(planet) {
  return (
    planet["koi_disposition"] === "CONFIRMED" &&
    planet["koi_insol"] > 0.36 &&
    planet["koi_insol"] < 1.11 &&
    planet["koi_prad"] < 1.6
  );
}

function loadPlanetsData() {
  return new Promise((resolve, reject) => {
    fs.createReadStream(path.join(__dirname, '..', '..', "data", "kepler_data.csv"))
      .pipe(
        parse({
          comment: "#",
          columns: true,
        })
      )
      .on("data", async (data) => {
        if (isHabitablePlanet(data)) {
          savePlanet(data)
        }
      })
      .on("error", (err) => {
        console.log(err);
        reject();
      })
      .on("end", async () => {
        const countPlanets = (await getAllPlanets()).length;
        console.log(`${countPlanets} planets found!`);
        resolve();
      });
  });
}

async function getAllPlanets() {
  const habitablePlanets = await planets.find({}, { __v: 0, _id: 0 });
  return habitablePlanets
}

async function savePlanet(planet) {
  try {
    await planets.updateOne({
      keplerName: planet.kepler_name,
    }, {
      keplerName: planet.kepler_name,
    }, {
      upsert: false,
    });
  } catch(err) {
    console.error(`Could not insert planet ${planet}`);
  }

}

module.exports = {
  loadPlanetsData,
  getAllPlanets,
};
