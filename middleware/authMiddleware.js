// backend/middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import pool from '../db/postgresPool.js';

// ✅ Middleware para verificar el token JWT
export const authenticateJWT = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token no proporcionado' });
    }

    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expirado' });
      }
      return res.status(401).json({ message: 'Token inválido' });
    }
  } catch (err) {
    console.error('Authentication error:', err);
    return res.status(401).json({ message: 'Error de autenticación' });
  }
};

// ✅ Middleware para verificar roles específicos
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.rol) {
      return res.status(403).json({ message: 'Acceso denegado: no se encontró información de rol' });
    }

    const userRole = req.user.rol.toLowerCase();
    const hasRole = allowedRoles.some(role => role.toLowerCase() === userRole);

    if (!hasRole) {
      return res.status(403).json({ 
        message: `Acceso denegado: se requieren los roles ${allowedRoles.join(' o ')}, pero tienes ${req.user.rol}`
      });
    }

    next();
  };
};