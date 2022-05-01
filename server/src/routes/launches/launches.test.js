const request = require("supertest");

const app = require("../../app");
const { mongoConnect, mongoDisconnect } = require("../../services/mongo");

describe("Launches API", () => {
  beforeAll(async () => {
    await mongoConnect();
  });

  afterAll(async () => {
    await mongoDisconnect();
  })


  describe("Tets GET /launches", () => {
    it("should response with 200 success", async () => {
      await request(app)
        .get("/v1/launches")
        .expect("Content-Type", "application/json; charset=utf-8")
        .expect(200);
    });
  });

  describe("Test POST /launches", () => {
    const completeLaunchData = {
      mission: "USS Enter",
      rocket: "NCC 170",
      target: "Kepler-186 f",
      launchDate: "January 4, 2028",
    };

    const launchDataWithoutDate = {
      mission: "USS Enter",
      rocket: "NCC 170",
      target: "Kepler-186 f",
    };

    const launchDataInvalidDate = {
      mission: "USS Enter",
      rocket: "NCC 170",
      target: "Kepler-186 f",
      launchDate: "Jazy",
    };

    it("should response with 200 success", async () => {
      const response = await request(app)
        .post("/v1/launches")
        .send(completeLaunchData)
        .expect("Content-Type", "application/json; charset=utf-8")
        .expect(201);

      const requestDate = new Date(completeLaunchData.launchDate).valueOf();
      const responseDate = new Date(response.body.launchDate).valueOf();

      expect(requestDate).toBe(responseDate);
      expect(response.body).toMatchObject(launchDataWithoutDate);
    });

    it("should catch missing required properties", async () => {
      const response = await request(app)
        .post("/v1/launches")
        .send(launchDataWithoutDate)
        .expect("Content-Type", "application/json; charset=utf-8")
        .expect(400);

      expect(response.body).toStrictEqual({
        error: "Mising required launch properties",
      });
    });

    it("should catch invalid dates", async () => {
      const response = await request(app)
        .post("/v1/launches")
        .send(launchDataInvalidDate)
        .expect("Content-Type", "application/json; charset=utf-8")
        .expect(400);

      expect(response.body).toStrictEqual({
        error: "Invalid launch date",
      });
    });
  });
});
