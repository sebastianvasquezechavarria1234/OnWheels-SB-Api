// middleware/authMiddleware.js
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
dotenv.config();

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (!authHeader) return res.status(401).json({ message: 'No token proporcionado' });

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ message: 'Formato de token inválido' });
  }

  const token = parts[1];
  jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
    if (err) return res.status(401).json({ message: 'Token inválido o expirado' });
    req.user = payload; // { id, email }
    next();
  });
}
