import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import db from "../db.js";
import { SEED_SETTINGS } from "./seed.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function sortByOrder(rows) {
  return rows;
}

export async function listProjects() {
  return db.prepare("SELECT * FROM projects ORDER BY sort_order ASC, id DESC").all();
}

export async function getProject(id) {
  return db.prepare("SELECT * FROM projects WHERE id = ?").get(id) || null;
}

export async function createProject(data) {
  const result = db
    .prepare(
      `INSERT INTO projects (title, description, category, image_url, sort_order)
       VALUES (@title, @description, @category, @image_url, @sort_order)`
    )
    .run(data);
  return getProject(result.lastInsertRowid);
}

export async function updateProject(id, data) {
  db.prepare(
    `UPDATE projects
     SET title = @title, description = @description, category = @category,
         image_url = @image_url, sort_order = @sort_order
     WHERE id = @id`
  ).run({ id, ...data });
  return getProject(id);
}

export async function deleteProject(id) {
  const existing = await getProject(id);
  if (!existing) return null;
  db.prepare("DELETE FROM projects WHERE id = ?").run(id);
  await deleteImage(existing.image_url);
  return existing;
}

export async function listClients() {
  return sortByOrder(db.prepare("SELECT * FROM clients ORDER BY sort_order ASC, id ASC").all());
}

export async function getClient(id) {
  return db.prepare("SELECT * FROM clients WHERE id = ?").get(id) || null;
}

export async function createClient(data) {
  const result = db
    .prepare(`INSERT INTO clients (name, image_url, sort_order) VALUES (@name, @image_url, @sort_order)`)
    .run(data);
  return getClient(result.lastInsertRowid);
}

export async function updateClient(id, data) {
  db.prepare(
    `UPDATE clients SET name = @name, image_url = @image_url, sort_order = @sort_order WHERE id = @id`
  ).run({ id, ...data });
  return getClient(id);
}

export async function deleteClient(id) {
  const existing = await getClient(id);
  if (!existing) return null;
  db.prepare("DELETE FROM clients WHERE id = ?").run(id);
  await deleteImage(existing.image_url);
  return existing;
}

export async function listTestimonials() {
  return db.prepare("SELECT * FROM testimonials ORDER BY sort_order ASC, id ASC").all();
}

export async function getTestimonial(id) {
  return db.prepare("SELECT * FROM testimonials WHERE id = ?").get(id) || null;
}

export async function createTestimonial(data) {
  const result = db
    .prepare(
      `INSERT INTO testimonials (quote, author_name, author_role, avatar_url, rating, sort_order)
       VALUES (@quote, @author_name, @author_role, @avatar_url, @rating, @sort_order)`
    )
    .run(data);
  return getTestimonial(result.lastInsertRowid);
}

export async function updateTestimonial(id, data) {
  db.prepare(
    `UPDATE testimonials
     SET quote = @quote, author_name = @author_name, author_role = @author_role,
         avatar_url = @avatar_url, rating = @rating, sort_order = @sort_order
     WHERE id = @id`
  ).run({ id, ...data });
  return getTestimonial(id);
}

export async function deleteTestimonial(id) {
  const existing = await getTestimonial(id);
  if (!existing) return null;
  db.prepare("DELETE FROM testimonials WHERE id = ?").run(id);
  await deleteImage(existing.avatar_url);
  return existing;
}

export async function listBlogPosts() {
  return db.prepare("SELECT * FROM blog_posts ORDER BY sort_order ASC, id ASC").all();
}

export async function getBlogPost(id) {
  return db.prepare("SELECT * FROM blog_posts WHERE id = ?").get(id) || null;
}

export async function createBlogPost(data) {
  const result = db
    .prepare(
      `INSERT INTO blog_posts (title, category, image_url, author, date_label, link, sort_order)
       VALUES (@title, @category, @image_url, @author, @date_label, @link, @sort_order)`
    )
    .run(data);
  return getBlogPost(result.lastInsertRowid);
}

export async function updateBlogPost(id, data) {
  db.prepare(
    `UPDATE blog_posts
     SET title = @title, category = @category, image_url = @image_url, author = @author,
         date_label = @date_label, link = @link, sort_order = @sort_order
     WHERE id = @id`
  ).run({ id, ...data });
  return getBlogPost(id);
}

export async function deleteBlogPost(id) {
  const existing = await getBlogPost(id);
  if (!existing) return null;
  db.prepare("DELETE FROM blog_posts WHERE id = ?").run(id);
  await deleteImage(existing.image_url);
  return existing;
}

export async function getSettings() {
  const rows = db.prepare("SELECT key, value FROM settings").all();
  const settings = { ...SEED_SETTINGS };
  rows.forEach((row) => {
    settings[row.key] = row.value;
  });
  return settings;
}

export async function updateSettings(patch) {
  const upsert = db.prepare(
    `INSERT INTO settings (key, value) VALUES (@key, @value)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`
  );
  const run = db.transaction((entries) => {
    Object.entries(entries).forEach(([key, value]) => {
      upsert.run({ key, value: String(value ?? "") });
    });
  });
  run(patch);
  return getSettings();
}

export async function getSiteContent() {
  const [projects, clients, testimonials, blog, settings] = await Promise.all([
    listProjects(),
    listClients(),
    listTestimonials(),
    listBlogPosts(),
    getSettings(),
  ]);
  return { projects, clients, testimonials, blog, settings };
}

export async function deleteImage(imageUrl) {
  if (!imageUrl || !imageUrl.startsWith("/uploads/")) {
    return;
  }

  const filePath = path.join(__dirname, "../..", imageUrl.replace(/^\//, ""));
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}
