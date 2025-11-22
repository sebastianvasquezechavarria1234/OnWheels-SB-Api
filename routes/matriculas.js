import express from "express"
import { authenticateToken, authorizeModule } from "../middleware/authMiddleware.js"
import {
  getMatriculas,
  getMatriculaById,
  createMatricula,
  updateMatricula,
  deleteMatricula,
} from "../controllers/matriculasController.js"

const router = express.Router()

router.get("/", authenticateToken, authorizeModule("clases"), getMatriculas)
router.get("/:id", authenticateToken, authorizeModule("clases"), getMatriculaById)
router.post("/", authenticateToken, authorizeModule("clases"), createMatricula)
router.put("/:id", authenticateToken, authorizeModule("clases"), updateMatricula)
router.delete("/:id", authenticateToken, authorizeModule("clases"), deleteMatricula)

export default router
