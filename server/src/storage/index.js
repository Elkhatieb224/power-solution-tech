const storage = process.env.VERCEL
  ? await import("./blob.js")
  : await import("./sqlite.js");

export default storage;
