// // routes/eventos.routes.js
// import express from "express";
// import { authenticateToken } from "../middleware/authMiddleware.js";
// import { adminOrPermission } from "../middleware/adminOrPermission.js";
// import {
//   getEventos,
//   getEventoById,
//   createEvento,
//   updateEvento,
//   deleteEvento,
//   getEventosPorCategoria,
//   getEventosFuturos
// } from "../controllers/eventosController.js";

// const router = express.Router();

// // ============================================
// // RUTAS PARA EVENTOS (con sistema de permisos)
// // ============================================

// // Ver todos los eventos → requiere "ver_eventos"
// router.get(
//   "/",
//   authenticateToken,
//   adminOrPermission("ver_eventos"),
//   getEventos
// );

// // Ver eventos futuros → también parte de "ver_eventos"
// router.get(
//   "/futuros",
//   authenticateToken,
//   adminOrPermission("ver_eventos"),
//   getEventosFuturos
// );

// // Ver eventos por categoría → también "ver_eventos"
// router.get(
//   "/categoria/:categoriaId",
//   authenticateToken,
//   adminOrPermission("ver_eventos"),
//   getEventosPorCategoria
// );

// // Ver un evento específico → "ver_eventos"
// router.get(
//   "/:id",
//   authenticateToken,
//   adminOrPermission("ver_eventos"),
//   getEventoById
// );

// // Crear evento → requiere "gestionar_eventos"
// router.post(
//   "/",
//   authenticateToken,
//   adminOrPermission("gestionar_eventos"),
//   createEvento
// );

// // Actualizar evento → "gestionar_eventos"
// router.put(
//   "/:id",
//   authenticateToken,
//   adminOrPermission("gestionar_eventos"),
//   updateEvento
// );

// // Eliminar evento → "gestionar_eventos"
// router.delete(
//   "/:id",
//   authenticateToken,
//   adminOrPermission("gestionar_eventos"),
//   deleteEvento
// );

// export default router;

// routes/eventos.routes.js
import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { adminOrPermission } from "../middleware/adminOrPermission.js";
import {
  getEventos,
  getEventoById,
  createEvento,
  updateEvento,
  deleteEvento,
  getEventosPorCategoria,
  getEventosFuturos
} from "../controllers/eventosController.js";

const router = express.Router();

// ============================================
// RUTAS PÚBLICAS (NO requieren login)
// ============================================

// Obtener todos los eventos
router.get("/", getEventos);

// Obtener eventos futuros
router.get("/futuros", getEventosFuturos);

// Obtener eventos por categoría
router.get("/categoria/:categoriaId", getEventosPorCategoria);

// Obtener evento por ID
router.get("/:id", getEventoById);


// ============================================
// RUTAS PROTEGIDAS (requieren autenticación)
// ============================================

// Crear evento → requiere "gestionar_eventos"
router.post(
  "/",
  authenticateToken,
  adminOrPermission("gestionar_eventos"),
  createEvento
);

// Actualizar evento → requiere "gestionar_eventos"
router.put(
  "/:id",
  authenticateToken,
  adminOrPermission("gestionar_eventos"),
  updateEvento
);

// Eliminar evento → requiere "gestionar_eventos"
router.delete(
  "/:id",
  authenticateToken,
  adminOrPermission("gestionar_eventos"),
  deleteEvento
);

export default router;
