// routes/usuarios.js
import { Router } from 'express';
import usuarioController from '../controllers/usuariosController.js';

const router = Router();

router.get('/', usuarioController.getAll);
router.get('/:id', usuarioController.getById);
router.post('/', usuarioController.create);
router.put('/:id', usuarioController.update);
router.delete('/:id', usuarioController.delete);

export default router;