const {
  getAllLaunches,
  addNewLaunch,
  isLaunchExists,
  abortLaunchById,
} = require("../../models/launches.model");

const { getPagination } = require('../../services/query');

async function httpGetAllLaunches(req, res) {
  const { limit, skip } = getPagination(req.query);
  res.status(200).json(await getAllLaunches(skip, limit));
}

async function httpAddNewLaunch(req, res) {
  const launch = req.body;

  if (
    !launch.mission ||
    !launch.rocket ||
    !launch.launchDate ||
    !launch.target
  ) {
    return res.status(400).json({
      error: "Mising required launch properties",
    });
  }

  launch.launchDate = new Date(launch.launchDate);
  if (isNaN(launch.launchDate)) {
    return res.status(400).json({
      error: "Invalid launch date",
    });
  }

  await addNewLaunch(launch);
  return res.status(201).json(launch);
}

async function httpAbortLaunch(req, res) {
  const id = Number(req.params.id);

  if (!isLaunchExists(id)) {
    return res.status(404).json({
      error: "launch not found",
    });
  }

  const deletedLaunch = await abortLaunchById(id);
  if (!deletedLaunch) {
    return res.status(400).json({ error: `Launch with with id ${id} was not deleted`});
  }

  return res.status(200).json({
    ok: true
  })
}

module.exports = {
  httpAddNewLaunch,
  httpGetAllLaunches,
  httpAbortLaunch,
};
