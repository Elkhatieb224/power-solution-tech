import crypto from "crypto";
import path from "path";
import { del, head, list, put } from "@vercel/blob";
import {
  SEED_PROJECTS,
  SEED_CLIENTS,
  SEED_TESTIMONIALS,
  SEED_BLOG,
  SEED_SETTINGS,
} from "./seed.js";

async function readJson(blobPath, seedFactory) {
  try {
    const meta = await head(blobPath);
    const response = await fetch(meta.url);
    if (!response.ok) throw new Error("read failed");
    return await response.json();
  } catch {
    const seeded = seedFactory();
    await writeJson(blobPath, seeded);
    return seeded;
  }
}

async function writeJson(blobPath, data) {
  await put(blobPath, JSON.stringify(data), {
    access: "public",
    addRandomSuffix: false,
    contentType: "application/json",
    allowOverwrite: true,
  });
}

function withIds(items) {
  return items.map((item, index) => ({
    id: index + 1,
    ...item,
    created_at: new Date().toISOString(),
  }));
}

function sortRows(rows) {
  return [...rows].sort((a, b) => {
    if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
    return a.id - b.id;
  });
}

function nextId(rows) {
  return rows.reduce((max, row) => Math.max(max, row.id), 0) + 1;
}

async function crudList(blobPath, seedFactory) {
  return sortRows(await readJson(blobPath, seedFactory));
}

async function crudGet(blobPath, seedFactory, id) {
  const rows = await readJson(blobPath, seedFactory);
  return rows.find((row) => row.id === Number(id)) || null;
}

async function crudCreate(blobPath, seedFactory, data) {
  const rows = await readJson(blobPath, seedFactory);
  const row = { id: nextId(rows), ...data, created_at: new Date().toISOString() };
  rows.push(row);
  await writeJson(blobPath, rows);
  return row;
}

async function crudUpdate(blobPath, seedFactory, id, data, imageKey = "image_url") {
  const rows = await readJson(blobPath, seedFactory);
  const index = rows.findIndex((row) => row.id === Number(id));
  if (index === -1) return null;
  rows[index] = { ...rows[index], ...data };
  await writeJson(blobPath, rows);
  return rows[index];
}

async function crudDelete(blobPath, seedFactory, id, imageKey = "image_url") {
  const rows = await readJson(blobPath, seedFactory);
  const index = rows.findIndex((row) => row.id === Number(id));
  if (index === -1) return null;
  const [removed] = rows.splice(index, 1);
  await writeJson(blobPath, rows);
  if (removed[imageKey]) await deleteImage(removed[imageKey]);
  return removed;
}

const PATHS = {
  projects: "pst/data/projects.json",
  clients: "pst/data/clients.json",
  testimonials: "pst/data/testimonials.json",
  blog: "pst/data/blog.json",
  settings: "pst/data/settings.json",
};

export async function listProjects() {
  return crudList(PATHS.projects, () => withIds(SEED_PROJECTS));
}
export async function getProject(id) {
  return crudGet(PATHS.projects, () => withIds(SEED_PROJECTS), id);
}
export async function createProject(data) {
  return crudCreate(PATHS.projects, () => withIds(SEED_PROJECTS), data);
}
export async function updateProject(id, data) {
  return crudUpdate(PATHS.projects, () => withIds(SEED_PROJECTS), id, data);
}
export async function deleteProject(id) {
  return crudDelete(PATHS.projects, () => withIds(SEED_PROJECTS), id);
}

export async function listClients() {
  return crudList(PATHS.clients, () => withIds(SEED_CLIENTS));
}
export async function getClient(id) {
  return crudGet(PATHS.clients, () => withIds(SEED_CLIENTS), id);
}
export async function createClient(data) {
  return crudCreate(PATHS.clients, () => withIds(SEED_CLIENTS), data);
}
export async function updateClient(id, data) {
  return crudUpdate(PATHS.clients, () => withIds(SEED_CLIENTS), id, data);
}
export async function deleteClient(id) {
  return crudDelete(PATHS.clients, () => withIds(SEED_CLIENTS), id);
}

export async function listTestimonials() {
  return crudList(PATHS.testimonials, () => withIds(SEED_TESTIMONIALS));
}
export async function getTestimonial(id) {
  return crudGet(PATHS.testimonials, () => withIds(SEED_TESTIMONIALS), id);
}
export async function createTestimonial(data) {
  return crudCreate(PATHS.testimonials, () => withIds(SEED_TESTIMONIALS), data);
}
export async function updateTestimonial(id, data) {
  return crudUpdate(PATHS.testimonials, () => withIds(SEED_TESTIMONIALS), id, data, "avatar_url");
}
export async function deleteTestimonial(id) {
  return crudDelete(PATHS.testimonials, () => withIds(SEED_TESTIMONIALS), id, "avatar_url");
}

export async function listBlogPosts() {
  return crudList(PATHS.blog, () => withIds(SEED_BLOG));
}
export async function getBlogPost(id) {
  return crudGet(PATHS.blog, () => withIds(SEED_BLOG), id);
}
export async function createBlogPost(data) {
  return crudCreate(PATHS.blog, () => withIds(SEED_BLOG), data);
}
export async function updateBlogPost(id, data) {
  return crudUpdate(PATHS.blog, () => withIds(SEED_BLOG), id, data);
}
export async function deleteBlogPost(id) {
  return crudDelete(PATHS.blog, () => withIds(SEED_BLOG), id);
}

export async function getSettings() {
  return readJson(PATHS.settings, () => ({ ...SEED_SETTINGS }));
}

export async function updateSettings(patch) {
  const current = await getSettings();
  const next = { ...current, ...patch };
  await writeJson(PATHS.settings, next);
  return next;
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

export async function saveUpload(file) {
  const ext = path.extname(file.originalname).toLowerCase();
  const safeExt = [".jpg", ".jpeg", ".png", ".webp"].includes(ext) ? ext : ".jpg";
  const filename = `pst/uploads/${Date.now()}-${crypto.randomBytes(6).toString("hex")}${safeExt}`;

  const blob = await put(filename, file.buffer, {
    access: "public",
    contentType: file.mimetype,
  });

  return blob.url;
}

export async function deleteImage(imageUrl) {
  if (!imageUrl || !imageUrl.startsWith("http")) {
    return;
  }

  try {
    const blobs = await list({ prefix: "pst/uploads/" });
    const match = blobs.blobs.find((blob) => blob.url === imageUrl);
    if (match) await del(match.url);
  } catch {
    // ignore
  }
}
