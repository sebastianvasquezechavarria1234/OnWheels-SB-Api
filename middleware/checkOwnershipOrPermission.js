import pool from "../db/postgresPool.js";
import { adminOrPermission } from "../middleware/adminOrPermission.js"

export function checkOwnershipOrPermission({ sql, ownerField, permission }) {
  return async (req, res, next) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Usuario no autenticado" });

      // Si es admin, pasa
      if (Array.isArray(req.user.roles) && req.user.roles.includes("administrador")) return next();

      // ejecutar consulta para obtener owner
      const id = req.params.id;
      const { rows } = await pool.query(sql, [id]);

      if (!rows || rows.length === 0) return res.status(404).json({ message: "Recurso no encontrado" });

      const ownerId = rows[0][ownerField];
      if (String(ownerId) === String(req.user.id_usuario)) return next();

      // no es owner: revisar permiso
      return adminOrPermission(permission)(req, res, next);
    } catch (err) {
      console.error("checkOwnershipOrPermission error:", err);
      return res.status(500).json({ message: "Error verificando propiedad" });
    }
  };
}
