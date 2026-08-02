import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  SEED_PROJECTS,
  SEED_CLIENTS,
  SEED_TESTIMONIALS,
  SEED_BLOG,
  SEED_SETTINGS,
} from "./storage/seed.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "../data");
const dbPath = path.join(dataDir, "projects.db");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL CHECK(category IN ('web', 'systems', 'apps')),
    image_url TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    image_url TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS testimonials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quote TEXT NOT NULL,
    author_name TEXT NOT NULL,
    author_role TEXT NOT NULL DEFAULT '',
    avatar_url TEXT NOT NULL DEFAULT '',
    rating INTEGER NOT NULL DEFAULT 5,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS blog_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT '',
    image_url TEXT NOT NULL,
    author TEXT NOT NULL DEFAULT '',
    date_label TEXT NOT NULL DEFAULT '',
    link TEXT NOT NULL DEFAULT 'news-details.html',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

function seedIfEmpty(table, rows, insertSql, mapRow) {
  const count = db.prepare(`SELECT COUNT(*) AS total FROM ${table}`).get().total;
  if (count > 0) return;

  const insert = db.prepare(insertSql);
  const run = db.transaction((items) => {
    items.forEach((item) => insert.run(mapRow(item)));
  });
  run(rows);
}

seedIfEmpty(
  "projects",
  SEED_PROJECTS,
  `INSERT INTO projects (title, description, category, image_url, sort_order)
   VALUES (@title, @description, @category, @image_url, @sort_order)`,
  (row) => row
);

seedIfEmpty(
  "clients",
  SEED_CLIENTS,
  `INSERT INTO clients (name, image_url, sort_order)
   VALUES (@name, @image_url, @sort_order)`,
  (row) => row
);

seedIfEmpty(
  "testimonials",
  SEED_TESTIMONIALS,
  `INSERT INTO testimonials (quote, author_name, author_role, avatar_url, rating, sort_order)
   VALUES (@quote, @author_name, @author_role, @avatar_url, @rating, @sort_order)`,
  (row) => row
);

seedIfEmpty(
  "blog_posts",
  SEED_BLOG,
  `INSERT INTO blog_posts (title, category, image_url, author, date_label, link, sort_order)
   VALUES (@title, @category, @image_url, @author, @date_label, @link, @sort_order)`,
  (row) => row
);

const settingsCount = db.prepare("SELECT COUNT(*) AS total FROM settings").get().total;
if (settingsCount === 0) {
  const insertSetting = db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)");
  const seedSettings = db.transaction((entries) => {
    Object.entries(entries).forEach(([key, value]) => insertSetting.run(key, value));
  });
  seedSettings(SEED_SETTINGS);
}

export default db;
