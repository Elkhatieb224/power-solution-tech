import jwt from "jsonwebtoken";

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "غير مصرح. سجّل الدخول أولاً." });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: "انتهت الجلسة. سجّل الدخول مجدداً." });
  }
}

export function signToken(username) {
  return jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: "7d" });
}
