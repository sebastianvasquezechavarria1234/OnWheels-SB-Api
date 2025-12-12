// routes/clientes.js
import express from "express";
import { Router } from "express";

import {
  getClientes,
  getClienteById,
  createCliente,
  updateCliente,
  deleteCliente,
} from "../controllers/clientesController.js";

const router = Router();

router.post("/",  createCliente);
router.get("/",  getClientes);
router.get("/:id",  getClienteById);
router.put("/:id",  updateCliente);
router.delete("/:id",  deleteCliente);

export default router;