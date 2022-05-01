const axios = require("axios");

const launches = require("./launches.mongo");
const planets = require("./planets.mongo");

const DEFAULT_LAUNCH_NUMBER = 100;

const SPACEX_API_URL = "https://api.spacexdata.com/v4";

const launch = {
  flightNumber: 100,
  mission: "Kepler Exploration X",
  rocket: "Explorer IS1",
  launchDate: new Date("December 27, 2030"),
  target: "Kepler-442 b",
  customers: ["ZTM", "NASA"],
  upcoming: true,
  success: true,
};

saveLaunch(launch);

async function findLaunch(filter) {
  return await launches.findOne(filter);
}

async function populateLaunches() {
  const response = await axios.post(`${SPACEX_API_URL}/launches/query`, {
    query: {},
    pagination: false,
    options: {
      populate: [
        {
          path: "rocket",
          select: {
            name: 1,
          },
        },
        {
          path: "payloads",
          select: {
            customers: 1,
          },
        },
      ],
    },
  });

  const launchDocs = response.data.docs;
  
  if (response.status !== 200) {
    console.log('Problem downloading launch data');
    throw new Error('Launch data download failed');
  }
  
  for (const launchDoc of launchDocs) {
    const payloads = launchDoc["payloads"];
    const customers = payloads.flatMap((payload) => {
      return payload["customers"];
    });

    const launch = {
      flightNumber: launchDoc["flight_number"],
      mission: launchDoc["name"],
      rocket: launchDoc["rocket"]["name"],
      launchDate: launchDoc["date_local"],
      upcoming: launchDoc["upcoming"],
      success: launchDoc["success"],
      customers,
    };

    await saveLaunch(launch);
  }
}

async function loadLaunchesData() {
  const isLaunchExist = await findLaunch({
    flightNumber: 1,
    rocket: "Falcon 1",
    mission: "FalconSat",
  });

  if (!isLaunchExist) {
    await populateLaunches();  
  }

}

function isLaunchExists(id) {
  return !!launches.exists({ flightNumber: id });
}

async function getAllLaunches(skip, limit) {
  return await launches.find({}, { __v: 0, _id: 0 })
    .sort({ flightNumber: 1 })
    .skip(skip)
    .limit(limit);
}

async function getLatestFlightNumber() {
  const latestLaunch = await launches.findOne().sort("-flightNumber");

  if (!latestLaunch) {
    return DEFAULT_LAUNCH_NUMBER;
  }

  return latestLaunch.flightNumber;
}

async function saveLaunch(launch) {
  try {
    await launches.findOneAndUpdate(
      {
        flightNumber: launch.flightNumber,
      },
      launch,
      {
        upsert: true,
      }
    );
  } catch (err) {
    console.error(
      `Launch wasn't inserted in the database ${launch.flightNumber}`
    );
  }
}

async function abortLaunchById(launchId) {
  const aborted = await launches.updateOne(
    { flightNumber: launchId },
    {
      upcoming: false,
      success: false,
    }
  );

  return aborted.modifiedCount === 1;
}

async function addNewLaunch(launch) {
  const planet = planets.findOne({ keplerName: launch.keplerName });

  if (!planet) {
    throw new Error("Unknown planet");
  }

  const latestFlightNumber = (await getLatestFlightNumber()) + 1;

  const newLaunch = {
    ...launch,
    upcoming: true,
    success: true,
    customers: ["Zero to mastery", "NASA"],
    flightNumber: latestFlightNumber,
  };

  await saveLaunch(newLaunch);
}

module.exports = {
  loadLaunchesData,
  isLaunchExists,
  getAllLaunches,
  abortLaunchById,
  addNewLaunch,
};
