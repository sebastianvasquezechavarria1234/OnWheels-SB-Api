// routes/matriculas.routes.js
import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { adminOrPermission } from "../middleware/adminOrPermission.js";
import {
  crear as createMatricula,
  listar as getMatriculas,
  obtenerPorId as getMatriculaById,
  actualizar as updateMatricula,
  eliminar as deleteMatricula,
  getMisMatriculas,
  getEstudiantesDeInstructor,
  listarPorEstudiante
} from "../controllers/matriculasController.js";
import { registrarPago, obtenerPagosPorMatricula } from "../models/pagosModel.js";
import { renovarMatricula, pausarMatricula, reanudarMatricula } from "../models/matriculasModel.js";

const router = express.Router();

// ✅ Rutas específicas PRIMERO (antes de /:id para evitar colisiones)

// Mis matrículas (Estudiante autenticado)
router.get("/mis-matriculas", authenticateToken, getMisMatriculas);

// Estudiantes del instructor autenticado
router.get("/instructor/:id_usuario", authenticateToken, getEstudiantesDeInstructor);

// Historial de un estudiante específico (Admin)
router.get("/estudiante/:id_estudiante", authenticateToken, adminOrPermission("ver_matriculas"), listarPorEstudiante);

// Listar matrículas → solo admin o con permiso "ver_matriculas"
router.get("/", authenticateToken, adminOrPermission("ver_matriculas"), getMatriculas);

// Ver una matrícula → solo admin o con "ver_matriculas"
router.get("/:id", authenticateToken, adminOrPermission("ver_matriculas"), getMatriculaById);

// Crear matrícula → solo con "gestionar_matriculas"
router.post("/", authenticateToken, adminOrPermission("gestionar_matriculas"), createMatricula);

// Actualizar matrícula → solo con "gestionar_matriculas"
router.put("/:id", authenticateToken, adminOrPermission("gestionar_matriculas"), updateMatricula);

// Eliminar matrícula → solo con "gestionar_matriculas"
router.delete("/:id", authenticateToken, adminOrPermission("gestionar_matriculas"), deleteMatricula);

// ─── Pagos ────────────────────────────────────────────────────────────────────

// Registrar un pago para una matrícula
router.post("/:id/pagos", authenticateToken, adminOrPermission("gestionar_matriculas"), async (req, res) => {
  try {
    const { id } = req.params;
    const { monto, nota, fecha } = req.body;

    const montoNum = parseFloat(monto);
    if (!monto || isNaN(montoNum) || montoNum <= 0) {
      return res.status(400).json({ mensaje: "El monto debe ser un número mayor a 0" });
    }

    const result = await registrarPago(id, { monto: montoNum, nota, fecha });
    res.status(201).json({
      mensaje: "Pago registrado exitosamente",
      pago: result.pago,
      matricula: result.matricula
    });
  } catch (error) {
    console.error("Error al registrar pago:", error);
    res.status(500).json({ mensaje: "Error al registrar el pago", detalle: error.message });
  }
});

// Obtener pagos de una matrícula
router.get("/:id/pagos", authenticateToken, adminOrPermission("ver_matriculas"), async (req, res) => {
  try {
    const { id } = req.params;
    const pagos = await obtenerPagosPorMatricula(id);
    res.json(pagos);
  } catch (error) {
    console.error("Error al obtener pagos:", error);
    res.status(500).json({ mensaje: "Error al obtener los pagos", detalle: error.message });
  }
});

// Renovar una matrícula vencida (crea nueva con los mismos datos, opcionalmente cambiando el plan)
router.post("/:id/renovar", authenticateToken, adminOrPermission("gestionar_matriculas"), async (req, res) => {
  try {
    const { id } = req.params;
    const { id_plan } = req.body; // opcional: permite cambiar el plan al renovar
    const nuevaMatricula = await renovarMatricula(id, id_plan || null);
    res.status(201).json({
      mensaje: "Matrícula renovada exitosamente",
      matricula: nuevaMatricula
    });
  } catch (error) {
    console.error("Error al renovar matrícula:", error);
    res.status(400).json({ mensaje: error.message || "Error al renovar la matrícula" });
  }
});

// Pausar una matrícula activa
router.post("/:id/pausar", authenticateToken, adminOrPermission("gestionar_matriculas"), async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;
    const matriculaPausada = await pausarMatricula(id, motivo);
    res.json({ mensaje: "Matrícula pausada correctamente", matricula: matriculaPausada });
  } catch (error) {
    res.status(400).json({ mensaje: error.message });
  }
});

// Reanudar una matrícula pausada
router.post("/:id/reanudar", authenticateToken, adminOrPermission("gestionar_matriculas"), async (req, res) => {
  try {
    const { id } = req.params;
    const matriculaReanudada = await reanudarMatricula(id);
    res.json({ mensaje: "Matrícula reanudada correctamente", matricula: matriculaReanudada });
  } catch (error) {
    res.status(400).json({ mensaje: error.message });
  }
});

export default router;
