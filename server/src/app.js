import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import storage from "./storage/index.js";
import { authMiddleware, signToken } from "./auth.js";
import { createUpload } from "./upload.js";

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), "../.env") });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "../..");
const upload = createUpload(path.join(__dirname, "../uploads"));

const app = express();

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      if (origin.endsWith(".vercel.app") && allowedOrigins.includes("https://*.vercel.app")) {
        callback(null, true);
        return;
      }

      callback(null, false);
    },
  })
);

app.use(express.json());

if (!process.env.VERCEL) {
  app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
  app.use("/admin", express.static(path.join(rootDir, "admin")));
  app.use(express.static(rootDir));
}

async function resolveImage(req, existingUrl) {
  if (req.file) {
    const nextImage = process.env.VERCEL
      ? await storage.saveUpload(req.file)
      : `/uploads/${req.file.filename}`;

    if (existingUrl) {
      await storage.deleteImage(existingUrl);
    }

    return nextImage;
  }

  return req.body.image_url || existingUrl || "";
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, storage: process.env.VERCEL ? "blob" : "sqlite" });
});

app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body || {};

  if (
    username !== process.env.ADMIN_USERNAME ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    return res.status(401).json({ error: "اسم المستخدم أو كلمة المرور غير صحيحة." });
  }

  if (!process.env.JWT_SECRET || !process.env.ADMIN_PASSWORD) {
    return res.status(500).json({ error: "الخادم غير مهيأ. راجع متغيرات البيئة." });
  }

  res.json({ token: signToken(username), username });
});

app.get("/api/content", async (_req, res, next) => {
  try {
    res.json(await storage.getSiteContent());
  } catch (error) {
    next(error);
  }
});

/* ——— Projects ——— */
app.get("/api/projects", async (_req, res, next) => {
  try {
    res.json(await storage.listProjects());
  } catch (error) {
    next(error);
  }
});

app.get("/api/projects/:id", async (req, res, next) => {
  try {
    const project = await storage.getProject(req.params.id);
    if (!project) return res.status(404).json({ error: "المشروع غير موجود." });
    res.json(project);
  } catch (error) {
    next(error);
  }
});

app.post("/api/projects", authMiddleware, upload.single("image"), async (req, res, next) => {
  try {
    const { title, description, category, sort_order } = req.body;
    if (!title || !category) return res.status(400).json({ error: "العنوان والتصنيف مطلوبان." });
    if (!["web", "systems", "apps"].includes(category)) {
      return res.status(400).json({ error: "تصنيف غير صالح." });
    }

    const image_url = await resolveImage(req);
    if (!image_url) return res.status(400).json({ error: "صورة المشروع مطلوبة." });

    const project = await storage.createProject({
      title: title.trim(),
      description: (description || "").trim(),
      category,
      image_url,
      sort_order: Number(sort_order) || 0,
    });
    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
});

app.put("/api/projects/:id", authMiddleware, upload.single("image"), async (req, res, next) => {
  try {
    const existing = await storage.getProject(req.params.id);
    if (!existing) return res.status(404).json({ error: "المشروع غير موجود." });

    const category = req.body.category ?? existing.category;
    if (!["web", "systems", "apps"].includes(category)) {
      return res.status(400).json({ error: "تصنيف غير صالح." });
    }

    const project = await storage.updateProject(existing.id, {
      title: (req.body.title ?? existing.title).trim(),
      description: (req.body.description ?? existing.description).trim(),
      category,
      image_url: await resolveImage(req, existing.image_url),
      sort_order: Number(req.body.sort_order ?? existing.sort_order) || 0,
    });
    res.json(project);
  } catch (error) {
    next(error);
  }
});

app.delete("/api/projects/:id", authMiddleware, async (req, res, next) => {
  try {
    const existing = await storage.deleteProject(req.params.id);
    if (!existing) return res.status(404).json({ error: "المشروع غير موجود." });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

/* ——— Clients ——— */
app.get("/api/clients", async (_req, res, next) => {
  try {
    res.json(await storage.listClients());
  } catch (error) {
    next(error);
  }
});

app.post("/api/clients", authMiddleware, upload.single("image"), async (req, res, next) => {
  try {
    const name = (req.body.name || "").trim();
    if (!name) return res.status(400).json({ error: "اسم العميل مطلوب." });
    const image_url = await resolveImage(req);
    if (!image_url) return res.status(400).json({ error: "صورة العميل مطلوبة." });

    const client = await storage.createClient({
      name,
      image_url,
      sort_order: Number(req.body.sort_order) || 0,
    });
    res.status(201).json(client);
  } catch (error) {
    next(error);
  }
});

app.put("/api/clients/:id", authMiddleware, upload.single("image"), async (req, res, next) => {
  try {
    const existing = await storage.getClient(req.params.id);
    if (!existing) return res.status(404).json({ error: "العميل غير موجود." });

    const client = await storage.updateClient(existing.id, {
      name: (req.body.name ?? existing.name).trim(),
      image_url: await resolveImage(req, existing.image_url),
      sort_order: Number(req.body.sort_order ?? existing.sort_order) || 0,
    });
    res.json(client);
  } catch (error) {
    next(error);
  }
});

app.delete("/api/clients/:id", authMiddleware, async (req, res, next) => {
  try {
    const existing = await storage.deleteClient(req.params.id);
    if (!existing) return res.status(404).json({ error: "العميل غير موجود." });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

/* ——— Testimonials ——— */
app.get("/api/testimonials", async (_req, res, next) => {
  try {
    res.json(await storage.listTestimonials());
  } catch (error) {
    next(error);
  }
});

app.post("/api/testimonials", authMiddleware, upload.single("image"), async (req, res, next) => {
  try {
    const quote = (req.body.quote || "").trim();
    const author_name = (req.body.author_name || "").trim();
    if (!quote || !author_name) {
      return res.status(400).json({ error: "نص الشهادة واسم العميل مطلوبان." });
    }

    const avatar_url = await resolveImage(req, req.body.avatar_url || "");

    const item = await storage.createTestimonial({
      quote,
      author_name,
      author_role: (req.body.author_role || "").trim(),
      avatar_url: avatar_url || "/assets/img/blog/author2.jpg",
      rating: Math.min(5, Math.max(1, Number(req.body.rating) || 5)),
      sort_order: Number(req.body.sort_order) || 0,
    });
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
});

app.put("/api/testimonials/:id", authMiddleware, upload.single("image"), async (req, res, next) => {
  try {
    const existing = await storage.getTestimonial(req.params.id);
    if (!existing) return res.status(404).json({ error: "الشهادة غير موجودة." });

    const avatar_url = await resolveImage(req, existing.avatar_url);

    const item = await storage.updateTestimonial(existing.id, {
      quote: (req.body.quote ?? existing.quote).trim(),
      author_name: (req.body.author_name ?? existing.author_name).trim(),
      author_role: (req.body.author_role ?? existing.author_role).trim(),
      avatar_url,
      rating: Math.min(5, Math.max(1, Number(req.body.rating ?? existing.rating) || 5)),
      sort_order: Number(req.body.sort_order ?? existing.sort_order) || 0,
    });
    res.json(item);
  } catch (error) {
    next(error);
  }
});

app.delete("/api/testimonials/:id", authMiddleware, async (req, res, next) => {
  try {
    const existing = await storage.deleteTestimonial(req.params.id);
    if (!existing) return res.status(404).json({ error: "الشهادة غير موجودة." });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

/* ——— Blog ——— */
app.get("/api/blog", async (_req, res, next) => {
  try {
    res.json(await storage.listBlogPosts());
  } catch (error) {
    next(error);
  }
});

app.post("/api/blog", authMiddleware, upload.single("image"), async (req, res, next) => {
  try {
    const title = (req.body.title || "").trim();
    if (!title) return res.status(400).json({ error: "عنوان المقال مطلوب." });
    const image_url = await resolveImage(req);
    if (!image_url) return res.status(400).json({ error: "صورة المقال مطلوبة." });

    const post = await storage.createBlogPost({
      title,
      category: (req.body.category || "").trim(),
      image_url,
      author: (req.body.author || "").trim(),
      date_label: (req.body.date_label || "").trim(),
      link: (req.body.link || "news-details.html").trim(),
      sort_order: Number(req.body.sort_order) || 0,
    });
    res.status(201).json(post);
  } catch (error) {
    next(error);
  }
});

app.put("/api/blog/:id", authMiddleware, upload.single("image"), async (req, res, next) => {
  try {
    const existing = await storage.getBlogPost(req.params.id);
    if (!existing) return res.status(404).json({ error: "المقال غير موجود." });

    const post = await storage.updateBlogPost(existing.id, {
      title: (req.body.title ?? existing.title).trim(),
      category: (req.body.category ?? existing.category).trim(),
      image_url: await resolveImage(req, existing.image_url),
      author: (req.body.author ?? existing.author).trim(),
      date_label: (req.body.date_label ?? existing.date_label).trim(),
      link: (req.body.link ?? existing.link).trim(),
      sort_order: Number(req.body.sort_order ?? existing.sort_order) || 0,
    });
    res.json(post);
  } catch (error) {
    next(error);
  }
});

app.delete("/api/blog/:id", authMiddleware, async (req, res, next) => {
  try {
    const existing = await storage.deleteBlogPost(req.params.id);
    if (!existing) return res.status(404).json({ error: "المقال غير موجود." });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

/* ——— Settings (about / contact images + clients label) ——— */
app.get("/api/settings", async (_req, res, next) => {
  try {
    res.json(await storage.getSettings());
  } catch (error) {
    next(error);
  }
});

app.put("/api/settings", authMiddleware, upload.fields([
  { name: "about_image", maxCount: 1 },
  { name: "contact_image", maxCount: 1 },
]), async (req, res, next) => {
  try {
    const current = await storage.getSettings();
    const patch = {};

    if (typeof req.body.clients_label === "string") {
      patch.clients_label = req.body.clients_label.trim();
    }

    const aboutFile = req.files?.about_image?.[0];
    const contactFile = req.files?.contact_image?.[0];

    if (aboutFile) {
      const fakeReq = { file: aboutFile, body: {} };
      patch.about_image = await resolveImage(fakeReq, current.about_image);
    }

    if (contactFile) {
      const fakeReq = { file: contactFile, body: {} };
      patch.contact_image = await resolveImage(fakeReq, current.contact_image);
    }

    res.json(await storage.updateSettings(patch));
  } catch (error) {
    next(error);
  }
});

app.use((err, _req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: "خطأ في رفع الملف: " + err.message });
  }

  if (err && err.message && err.message.includes("نوع الصورة")) {
    return res.status(400).json({ error: err.message });
  }

  if (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || "خطأ في الخادم." });
  }

  next(err);
});

export default app;
