import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import pool from "../db/postgresPool.js";

dotenv.config();

export async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers["authorization"] || req.headers["Authorization"];
    if (!authHeader) return res.status(401).json({ message: "No token proporcionado" });

    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return res.status(401).json({ message: "Formato de token inválido" });
    }

    const token = parts[1];

    jwt.verify(token, process.env.JWT_SECRET, async (err, payload) => {
      if (err) {
        if (err.name === 'TokenExpiredError') return res.status(401).json({ message: "Token expirado" });
        return res.status(401).json({ message: "Token inválido" });
      }

      // payload debe contener id_usuario (según tu login)
      if (!payload || !payload.id_usuario) {
        return res.status(401).json({ message: "Token inválido: sin id de usuario" });
      }

      const userId = payload.id_usuario;

      // Obtener roles del usuario (normalizados a minúscula)
      const rolesRes = await pool.query(
        `SELECT r.nombre_rol
         FROM usuario_roles ur
         JOIN roles r ON ur.id_rol = r.id_rol
         WHERE ur.id_usuario = $1`,
        [userId]
      );
      const roles = rolesRes.rows.map(r => r.nombre_rol.toLowerCase());

      // Obtener permisos del usuario via roles
      // Atención: la tabla en tu modelo se llama ROLES_PERMISOS -> usar roles_permisos en minúsculas
      const permisosRes = await pool.query(
        `SELECT DISTINCT p.nombre_permiso
         FROM usuario_roles ur
         JOIN roles_permisos rp ON ur.id_rol = rp.id_rol
         JOIN permisos p ON rp.id_permiso = p.id_permiso
         WHERE ur.id_usuario = $1`,
        [userId]
      );
      const permisos = permisosRes.rows.map(p => p.nombre_permiso.toLowerCase());

      // Adjuntar al req.user la información completa y actualizada
      req.user = {
        id_usuario: userId,
        email: payload.email || null,
        roles,
        permisos
      };

      next();
    });
  } catch (err) {
    console.error("Authenticate token error:", err);
    res.status(500).json({ message: "Error en autenticación", error: err.message });
  }
}

/**
 * requireRole: acepta string o array
 * Ejemplo: requireRole('administrador') o requireRole(['administrador','contador'])
 */
export function requireRole(roleNames) {
  if (!Array.isArray(roleNames)) roleNames = [roleNames];

  const normalized = roleNames.map(r => r.toLowerCase());

  return (req, res, next) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Usuario no autenticado" });
      const hasRole = req.user.roles.some(r => normalized.includes(r));
      if (!hasRole) return res.status(403).json({ message: `Se requiere uno de estos roles: ${normalized.join(', ')}` });
      next();
    } catch (err) {
      console.error("requireRole error:", err);
      res.status(500).json({ message: "Error verificando rol", error: err.message });
    }
  };
}

/**
 * requirePermission: acepta string o array
 * Ejemplo: requirePermission('ver_ventas') o requirePermission(['ver_ventas','gestionar_ventas'])
 */
export function requirePermission(permissionNames) {
  if (!Array.isArray(permissionNames)) permissionNames = [permissionNames];
  const normalized = permissionNames.map(p => p.toLowerCase());

  return (req, res, next) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Usuario no autenticado" });
      const hasPermission = req.user.permisos.some(p => normalized.includes(p));
      if (!hasPermission) return res.status(403).json({ message: `Se requiere permiso: ${normalized.join(', ')}` });
      next();
    } catch (err) {
      console.error("requirePermission error:", err);
      res.status(500).json({ message: "Error verificando permiso", error: err.message });
    }
  };
}

/**
 * authorizeModule: alias que verifica permiso puntual (compatible con lo que tenías)
 * moduleName debe ser el nombre del permiso (p.nombre_permiso)
 */
export function authorizeModule(moduleName) {
  return requirePermission(moduleName);
}
