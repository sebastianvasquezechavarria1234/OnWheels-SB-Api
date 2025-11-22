// backend/routes/authRoutes.js
import { Router } from 'express';
import { body } from 'express-validator';
import { 
  register, 
  login, 
  requestPasswordReset, 
  resetPassword 
} from '../controllers/authController.js';
import { authenticateJWT } from '../middleware/authMiddleware.js';

const router = Router();

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

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Email inválido'),
    body('contrasena').notEmpty().withMessage('Contraseña requerida'),
  ],
  login
);

// NUEVAS RUTAS PARA RECUPERAR CONTRASEÑA
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