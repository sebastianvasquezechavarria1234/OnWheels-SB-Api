// routes/administradores.js
import  express  from "express";

import {
  getAdministradores,
  getAdministradorById,
  createAdministrador,
  updateAdministrador,
  deleteAdministrador,
  getUsuariosSinRol
} from "../controllers/administradoresController.js";

const router = express.Router();

router.get("/", getAdministradores);
router.get("/:id", getAdministradorById);
router.post("/", createAdministrador);
router.put("/:id", updateAdministrador);
router.delete("/:id", deleteAdministrador);
router.get("/usuarios/disponibles", getUsuariosSinRol);

export default router;