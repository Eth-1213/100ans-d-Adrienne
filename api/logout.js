import { serialize } from 'cookie';

export default async function handler(req, res) {
  const cookie = serialize('admin_token', '', {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: new Date(0),
    path: '/',
  });

  res.setHeader('Set-Cookie', cookie);
  return res.status(200).json({ success: true });
}
