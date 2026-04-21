import express from "express";
import { createServer as createViteServer } from "vite";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser());

  // API Routes
  app.post("/api/login", (req, res) => {
    const { password } = req.body;

    if (!process.env.ADMIN_PASSWORD) {
      // In dev environment or if user forgot
      return res.status(500).json({ error: 'ADMIN_PASSWORD environment variable not set' });
    }

    if (password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Mot de passe incorrect' });
    }

    const secret = process.env.JWT_SECRET || 'fallback-secret-for-demo';
    const token = jwt.sign({ admin: true }, secret, { expiresIn: '8h' });

    res.cookie('admin_token', token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8 * 1000, // 8 hours in ms
      path: '/'
    });

    res.status(200).json({ success: true });
  });

  app.get("/api/check-auth", (req, res) => {
    const token = req.cookies.admin_token;
    if (!token) {
      return res.status(401).json({ authenticated: false });
    }
    try {
      const secret = process.env.JWT_SECRET || 'fallback-secret-for-demo';
      jwt.verify(token, secret);
      return res.status(200).json({ authenticated: true });
    } catch {
      return res.status(401).json({ authenticated: false });
    }
  });

  app.post("/api/logout", (req, res) => {
    res.cookie('admin_token', '', { expires: new Date(0), path: '/' });
    res.status(200).json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
