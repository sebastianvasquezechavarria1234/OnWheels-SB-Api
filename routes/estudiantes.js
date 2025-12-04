import express from 'express';
const router = express.Router();
import estudianteController from '../controllers/estudianteController.mjs';

router.get('/', estudianteController.getAll);
router.get('/:id', estudianteController.getById);
router.post('/', estudianteController.create);
router.put('/:id', estudianteController.update);
router.delete('/:id', estudianteController.delete);

export default router;