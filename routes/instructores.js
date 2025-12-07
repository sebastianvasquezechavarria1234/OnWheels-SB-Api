import express from 'express';
import { authenticateToken } from "../middleware/authMiddleware.js";
import { adminOrPermission } from "../middleware/adminOrPermission.js";
import instructorController from '../controllers/instructorController.js';

const router = express.Router();

router.get('/', authenticateToken, adminOrPermission("ver_instructores"), instructorController.getAll);
router.get('/:id', authenticateToken, adminOrPermission("ver_instructores"), instructorController.getById);
router.post('/', authenticateToken, adminOrPermission("gestionar_instructores"), instructorController.create);
router.put('/:id', authenticateToken, adminOrPermission("gestionar_instructores"), instructorController.update);
router.delete('/:id', authenticateToken, adminOrPermission("gestionar_instructores"), instructorController.delete);

export default router;
