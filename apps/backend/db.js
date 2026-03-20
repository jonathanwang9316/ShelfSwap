import mysql from "mysql2/promise";
import { Connector as CloudSQLConnector } from "@google-cloud/cloud-sql-connector";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

process.env.GOOGLE_APPLICATION_CREDENTIALS = path.resolve(
  process.cwd(),
  process.env.GOOGLE_APPLICATION_CREDENTIALS
);

console.log(
  "Using Google credentials at:",
  process.env.GOOGLE_APPLICATION_CREDENTIALS
);

const INSTANCE_CONNECTION_NAME = process.env.INSTANCE_CONNECTION_NAME;
const DB_USER = process.env.DB_USER;
const DB_PASS = process.env.DB_PASS;
const DB_NAME = process.env.DB_NAME;
const IP_TYPE = process.env.IP_TYPE || "PUBLIC";
const DB_PORT = 3306;

const connector = new CloudSQLConnector();

export async function initDB() {
  try {
    const clientOpts = await connector.getOptions({
      instanceConnectionName: INSTANCE_CONNECTION_NAME,
      ipType: IP_TYPE,
    });

    console.log("Connecting to Cloud SQL MySQL...");

    const pool = mysql.createPool({
      ...clientOpts,
      user: DB_USER,
      password: DB_PASS,
      database: DB_NAME,
      port: DB_PORT,
      waitForConnections: true,
      connectionLimit: 10,
    });

    console.log("Connected to Cloud SQL MySQL!");

    return pool;
  } catch (err) {
    console.error("Failed to connect to Cloud SQL:", err);
    throw err;
  }
}
