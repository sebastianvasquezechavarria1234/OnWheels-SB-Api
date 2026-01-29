import express from 'express';
import { authenticateToken } from "../middleware/authMiddleware.js";
import { adminOrPermission } from "../middleware/adminOrPermission.js";
import { getInstructores, getInstructorById, createInstructor, updateInstructor, deleteInstructor, getUsuariosNoInstructores } from '../controllers/instructoresController.js';

const router = express.Router();

router.get('/', authenticateToken, adminOrPermission("ver_instructores"), getInstructores);
router.get('/usuarios/disponibles', authenticateToken, adminOrPermission("ver_instructores"), getUsuariosNoInstructores);
router.get('/:id', authenticateToken, adminOrPermission("ver_instructores"), getInstructorById);
router.post('/', authenticateToken, adminOrPermission("gestionar_instructores"), createInstructor);
router.put('/:id', authenticateToken, adminOrPermission("gestionar_instructores"), updateInstructor);
router.delete('/:id', authenticateToken, adminOrPermission("gestionar_instructores"), deleteInstructor);

export default router;
