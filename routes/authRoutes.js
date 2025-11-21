import { Router } from 'express';
import { body } from 'express-validator';
import { register, login } from '../controllers/authController.js';

const router = Router();

router.post(
  '/register',
  [
    body('nombre').notEmpty().withMessage('Nombre requerido'),
    body('email').isEmail().withMessage('Email inválido'),
    body('telefono').notEmpty().withMessage('Teléfono requerido'),
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

export default router;
