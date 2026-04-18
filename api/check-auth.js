import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  const token = req.cookies.admin_token;

  if (!token) {
    return res.status(401).json({ authenticated: false });
  }

  try {
    const secret = process.env.JWT_SECRET || 'fallback-secret-for-demo';
    jwt.verify(token, secret);
    return res.status(200).json({ authenticated: true });
  } catch (error) {
    return res.status(401).json({ authenticated: false });
  }
}
