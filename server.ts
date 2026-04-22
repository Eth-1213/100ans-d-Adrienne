import express from "express";
import { createServer as createViteServer } from "vite";
import cookieParser from "cookie-parser";
import cors from "cors";
import jwt from "jsonwebtoken";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Basic security and parsing
  app.use(cors());
  app.use(express.json());
  app.use(cookieParser());

  // Request logger
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  // API Routes
  app.post("/api/login", (req, res) => {
    const { password } = req.body;

    if (!process.env.ADMIN_PASSWORD) {
      console.error("ADMIN_PASSWORD is not set in environment");
      return res.status(500).json({ error: "Configuration du serveur incomplète (ADMIN_PASSWORD manquant)." });
    }

    if (password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: "Mot de passe incorrect" });
    }

    const secret = process.env.JWT_SECRET || 'fallback-secret';
    const token = jwt.sign({ admin: true }, secret, { expiresIn: '8h' });

    res.cookie('admin_token', token, {
      httpOnly: false, // Allow client-side to check existence for UI
      secure: true,
      sameSite: 'lax',
      maxAge: 8 * 60 * 60 * 1000,
      path: '/'
    });

    res.status(200).json({ success: true });
  });

  app.get("/api/check-auth", (req, res) => {
    const token = req.cookies.admin_token;
    if (!token) return res.status(401).json({ authenticated: false });

    try {
      const secret = process.env.JWT_SECRET || 'fallback-secret';
      jwt.verify(token, secret);
      res.status(200).json({ authenticated: true });
    } catch {
      res.status(401).json({ authenticated: false });
    }
  });

  app.post("/api/logout", (_req, res) => {
    res.clearCookie('admin_token', { path: '/' });
    res.status(200).json({ success: true });
  });

  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Final catch-all for errors
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => { // eslint-disable-line @typescript-eslint/no-unused-vars
    console.error("Critical server error:", err);
    res.status(500).json({ error: "Erreur interne du serveur" });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
});
