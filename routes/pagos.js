import express from "express";
import { registrarPago, obtenerPagosPorMatricula } from "../models/pagosModel.js";

const router = express.Router();

router.post("/:id/pagos", async (req, res) => {
  try {
    const { id } = req.params; // matrícula id
    const { monto, nota, fecha } = req.body;

    if (!monto || monto <= 0) {
      return res.status(400).json({ mensaje: "El monto debe ser mayor a 0" });
    }

    const { registrarPago } = await import("../models/pagosModel.js");
    const result = await registrarPago(id, { monto, nota, fecha });
    res.status(201).json({
      mensaje: "Pago registrado exitosamente",
      pago: result.pago,
      matricula: result.matricula
    });
  } catch (error) {
    console.error("Error al registrar pago:", error);
    res.status(500).json({ mensaje: "Error al registrar el pago" });
  }
});

router.get("/:id/pagos", async (req, res) => {
  try {
    const { id } = req.params;
    const { obtenerPagosPorMatricula } = await import("../models/pagosModel.js");
    const pagos = await obtenerPagosPorMatricula(id);
    res.json(pagos);
  } catch (error) {
    console.error("Error al obtener pagos:", error);
    res.status(500).json({ mensaje: "Error al obtener los pagos" });
  }
});

export default router;
