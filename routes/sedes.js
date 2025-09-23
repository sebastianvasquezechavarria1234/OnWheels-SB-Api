// routes/sedes.js
import express from "express"
import {
  getSedes,
  getSedeById,
  createSede,
  updateSede,
  deleteSede
} from "../controllers/sedesController.js"

const router = express.Router()

router.get("/", getSedes)          // Todas las sedes
router.get("/:id", getSedeById)    // Sede por ID
router.post("/", createSede)       // Crear sede
router.put("/:id", updateSede)     // Actualizar sede
router.delete("/:id", deleteSede)  // Eliminar sede

export default router
