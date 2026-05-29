/**
 * Usage (from anywhere):
 *   node Backend/scripts/health-check.mjs
 *   cd Backend/scripts && node health-check.mjs
 *
 * Requires Backend/.env with DB_* and GEMINI_* variables.
 */

import "./load-env.mjs";
import db from "../db/db_config.js";
import { GoogleGenAI } from "@google/genai";

const GEMINI_MODEL = (process.env.GEMINI_MODEL || "gemini-2.0-flash")
  .trim()
  .replace(/^['"]|['"]$/g, "");

function requireEnv(name) {
  const value = process.env[name];
  if (!value || !String(value).trim()) {
    throw new Error(`Missing env var: ${name}`);
  }
  return value;
}

async function checkDb() {
  console.log("== DB check ==");
  console.log("DB_HOST:", process.env.DB_HOST);
  console.log("DB_USER:", process.env.DB_USER);
  console.log("DB_DATABASE:", process.env.DB_DATABASE);

  const [ping] = await db.execute("SELECT 1 as ok");
  console.log("ping:", ping);

  // Check table exists
  const [tables] = await db.execute(
    "SHOW TABLES LIKE 'conversations'",
  );
  console.log("has conversations table:", tables.length > 0);

  // Read latest rows
  const [rows] = await db.execute(
    "SELECT id, role, content, token_count, created_at FROM conversations ORDER BY id DESC LIMIT 10",
  );
  console.log("latest conversations (up to 10):");
  for (const r of rows) {
    const content =
      typeof r.content === "string" && r.content.length > 80
        ? `${r.content.slice(0, 80)}…`
        : r.content;
    console.log(`- #${r.id} [${r.role}] (${r.created_at}) ${content}`);
  }
}

async function checkGemini() {
  console.log("\n== Gemini check ==");
  const apiKey = requireEnv("GEMINI_API_KEY");
  console.log("model:", GEMINI_MODEL);
  console.log("api key present:", Boolean(apiKey));

  const client = new GoogleGenAI({ apiKey });
  const res = await client.models.generateContent({
    model: GEMINI_MODEL,
    contents: "Reply with exactly: OK",
  });

  console.log("gemini response text:", JSON.stringify(res?.text ?? ""));
}

async function main() {
  try {
    await checkDb();
  } catch (e) {
    console.error("\nDB FAILED:", e?.code || "", e?.sqlMessage || e?.message || e);
    process.exitCode = 1;
  } finally {
    try {
      await db.end();
    } catch {
      // ignore
    }
  }

  try {
    await checkGemini();
  } catch (e) {
    console.error("\nGEMINI FAILED:", e?.message || e);
    process.exitCode = 1;
  }
}

main();

