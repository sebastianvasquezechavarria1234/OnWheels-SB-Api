import express from 'express';
const router = express.Router();
import instructorController from '../controllers/instructorController.js';

router.get('/', instructorController.getAll);
router.get('/:id', instructorController.getById);
router.post('/', instructorController.create);
router.put('/:id', instructorController.update);
router.delete('/:id', instructorController.delete);

export default router;