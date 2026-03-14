import { registrarPago, obtenerPagosPorMatricula } from "../models/pagosModel.js";

export const crearPago = async (req, res) => {
  try {
    const { id } = req.params; // matrícula id
    const { monto, nota, fecha } = req.body;

    if (!monto || monto <= 0) {
      return res.status(400).json({ mensaje: "El monto debe ser mayor a 0" });
    }

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
};

export const listarPagos = async (req, res) => {
  try {
    const { id } = req.params;
    const pagos = await obtenerPagosPorMatricula(id);
    res.json(pagos);
  } catch (error) {
    console.error("Error al obtener pagos:", error);
    res.status(500).json({ mensaje: "Error al obtener los pagos" });
  }
};
