// backend/routes/authRoutes.js
import { Router } from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
  requestPasswordReset,
  resetPassword,
  getAuthUser
} from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();
import { activateAccount } from '../controllers/activationController.js';

// Activar Cuenta
router.post('/activate', activateAccount);

// Registro
router.post(
  '/register',
  [
    body('nombre').notEmpty().withMessage('Nombre requerido'),
    body('email').isEmail().withMessage('Email inválido'),
    body('telefono').optional(),
    body('contrasena').isLength({ min: 6 }).withMessage('Contraseña mínimo 6 caracteres'),
  ],
  register
);

// Login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Email inválido'),
    body('contrasena').notEmpty().withMessage('Contraseña requerida'),
  ],
  login
);

// Perfil del usuario autenticado
// Perfil del usuario autenticado
router.get("/me", authenticateToken, getAuthUser);

// Recuperar contraseña
router.post(
  '/request-password-reset',
  [body('email').isEmail().withMessage('Email inválido')],
  requestPasswordReset
);

router.post(
  '/reset-password',
  [
    body('token').notEmpty().withMessage('Token requerido'),
    body('newPassword').isLength({ min: 6 }).withMessage('Contraseña mínimo 6 caracteres'),
  ],
  resetPassword
);

export default router;