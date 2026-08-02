// This file MUST be the first thing Node loads.
// It runs dotenv before any other ES module is initialized.
import { config } from "dotenv";
import { existsSync } from "fs";

if (existsSync(".env.local")) {
  config({ path: ".env.local" });
} else {
  config();
}
