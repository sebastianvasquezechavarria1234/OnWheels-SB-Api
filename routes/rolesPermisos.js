import express from "express"
import {
  getRolesPermisos,
  asignarPermisoARol,
  eliminarPermisoDeRol
} from "../controllers/rolesPermisosController.js"

const router = express.Router()

router.get("/", getRolesPermisos)
router.post("/", asignarPermisoARol)
router.delete("/:id", eliminarPermisoDeRol)

export default router
