import mongodb from "mongodb";
import dotenv from "dotenv";
import Sentry from "@sentry/node";

import { scrapeTvMatchen } from "./tvmatchen.js";
import { scrapeNBA } from "./nba.js";
import { scrapeHLTV } from "./hltv.js";

dotenv.config(); //read .env file (if it exists)
dotenv.config({ path: "config.env" });

const ENVIRONMENT = process.env.NODE_ENV || "development";

if (process.env.SENTRY_DSN) {
  Sentry.init({ dsn: process.env.SENTRY_DSN, environment: ENVIRONMENT });
} else {
  console.log("No Sentry DSN configured");
}

const mongodbURL = `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_URL}/${process.env.MONGODB_DBNAME}?retryWrites=true&w=majority`;

let DEBUG = false;

const mongoclient = new mongodb.MongoClient(mongodbURL, {
  native_parser: true,
  useUnifiedTopology: true,
  useNewUrlParser: true
});

async function doNBA(dbHandler) {
  const data = await getDataFromNBA();
  await saveDataToDatabase(dbHandler, data, "nba");
}

async function getDataFromNBA() {
  try {
    const data = await scrapeNBA();
    if (DEBUG) console.log(data);
    return data;
  } catch (error) {
    console.error(error);
    return [];
  }
}

async function doTvmatchen(dbHandler) {
  const data = await getDataFromTvmatchen();
  await saveDataToDatabase(dbHandler, data, "football");
}

async function getDataFromTvmatchen() {
  try {
    const data = await scrapeTvMatchen();
    if (DEBUG) console.log(data);
    return data;
  } catch (error) {
    console.error(error);
    return [];
  }
}

async function doHLTV(dbHandler) {
  const data = await getDataFromHLTV();
  await saveDataToDatabase(dbHandler, data, "cs");
}

async function getDataFromHLTV() {
  try {
    const data = await scrapeHLTV();
    if (DEBUG) console.log(data);
    return data;
  } catch (error) {
    console.error(error);
    return [];
  }
}

async function saveDataToDatabase(dbHandler, data, collectionName) {
  try {
    await removeAllFromCollection(dbHandler, collectionName);
  } catch (error) {
    console.error(error);
    return;
  }

  try {
    await insertToCollection(dbHandler, collectionName, data);
  } catch (error) {
    console.error(error);
    return;
  }
}

function removeAllFromCollection(dbHandler, collectionName) {
  if (DEBUG) console.log("removeAllFromCollection");

  return new Promise((resolve, reject) => {
    dbHandler.collection(collectionName).deleteMany();
    return resolve();
  });
}

function insertToCollection(dbHandler, collectionName, data) {
  if (DEBUG) console.log("insertToCollection");

  return new Promise((resolve, reject) => {
    dbHandler
      .collection(collectionName)
      .insertMany(data, function(error, result) {
        if (error) return reject(error);

        if (DEBUG) console.log(result);
        if (DEBUG) console.log("done inserting");

        return resolve();
      });
  });
}

async function scrapeAll(dbHandler) {
  await doTvmatchen(dbHandler);
  await doNBA(dbHandler);
  await doHLTV(dbHandler);
}

function main() {
  const args = process.argv.slice(2);

  try {
    mongoclient.connect(async err => {
      if (err) throw err;

      const dbHandler = mongoclient.db(process.env.MONGODB_DBNAME);

      const promises = [];

      for (const arg of args) {
        if (arg == "football") {
          const promise = doTvmatchen(dbHandler);
          promises.push(promise);
        } else if (arg == "nba") {
          const promise = doNBA(dbHandler);
          promises.push(promise);
        } else if (arg == "cs") {
          const promise = doHLTV(dbHandler);
          promises.push(promise);
        } else if (arg == "all") {
          const promise = scrapeAll(dbHandler);
          promises.push(promise);
        } else if (arg == "debug") {
          DEBUG = true;
        } else {
          console.error(`argument ${arg} is not supported`);
        }
      }

      Promise.all(promises).then(() => {
        mongoclient.close();
        process.exit(0);
      });
    });
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

main();
