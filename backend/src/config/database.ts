import { DataSource } from "typeorm";
import { User } from "../models/orm/User";
import { Quiz } from "../models/orm/Quiz";
import { Question } from "../models/orm/Question";
import { Result } from "../models/orm/Result";
import { InitialMigration1706800000000 } from "../migrations/1706800000000-InitialMigration";

// Environment variables (set these before running):
// DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_NAME
// JWT_SECRET, PORT

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USERNAME || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_NAME || "tahook",
  synchronize: false,
  logging: process.env.NODE_ENV === "development",
  entities: [User, Quiz, Question, Result],
  migrations: [InitialMigration1706800000000],
  subscribers: [],
});
