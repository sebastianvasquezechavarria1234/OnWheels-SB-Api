import express from "express";
import {
  getProveedores,
  getProveedorById,
  createProveedor,
  updateProveedor,
  deleteProveedor
} from "../controllers/proveedoresController.js";

const router = express.Router();

router.get("/", getProveedores);           
router.get("/:nit", getProveedorById);     
router.post("/", createProveedor);         
router.put("/:nit", updateProveedor);      
router.delete("/:nit", deleteProveedor);   

export default router;
