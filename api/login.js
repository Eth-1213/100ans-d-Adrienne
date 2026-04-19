import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password } = req.body;

  // 1. Check if ADMIN_PASSWORD is set
  if (!process.env.ADMIN_PASSWORD) {
    return res.status(500).json({ error: 'ADMIN_PASSWORD not configured on server' });
  }

  // 2. Verify password
  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Mot de passe incorrect' });
  }

  // 3. Generate JWT
  const secret = process.env.JWT_SECRET || 'fallback-secret-for-demo';
  const token = jwt.sign({ admin: true }, secret, { expiresIn: '8h' });

  // 4. Set cookie
  const cookie = serialize('admin_token', token, {
    httpOnly: false, // Accessible to client-side scripts for fast redirection
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', // Use lax for better compatibility after redirection
    maxAge: 60 * 60 * 8, // 8 hours
    path: '/',
  });

  res.setHeader('Set-Cookie', cookie);
  return res.status(200).json({ success: true });
}
