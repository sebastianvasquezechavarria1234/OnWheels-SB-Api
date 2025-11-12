import express from "express";
import {
  getVariantes,
  createVariante,
  updateVariante,
  deleteVariante,
} from "../controllers/variantesController.js";

const router = express.Router();

router.get("/", getVariantes);
router.post("/", createVariante);
router.put("/:id", updateVariante);
router.delete("/:id", deleteVariante);

export default router;
