// routes/sedes.js
import express from "express";
import {
  getSedes,
  getSedeById,
  createSede,
  updateSede,
  deleteSede
} from "../controllers/sedesController.js";

const router = express.Router();

router.get("/", getSedes);
router.get("/:id", getSedeById);
router.post("/", createSede);
router.put("/:id", updateSede);
router.delete("/:id", deleteSede);

export default router;