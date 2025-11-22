import dotenv from "dotenv"
import jwt from "jsonwebtoken"
import pool from "../db/postgresPool.js"

dotenv.config()

export function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"] || req.headers["Authorization"]
  if (!authHeader) return res.status(401).json({ message: "No token proporcionado" })

  const parts = authHeader.split(" ")
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(401).json({ message: "Formato de token inválido" })
  }

  const token = parts[1]
  jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
    if (err) return res.status(401).json({ message: "Token inválido o expirado" })
    req.user = payload
    next()
  })
}

export function authorizeModule(moduleName) {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Usuario no autenticado" })
      }

      // Check if user is admin (admins have access to everything)
      const adminCheck = await pool.query(
        `SELECT ur.id_rol FROM usuario_roles ur
         JOIN roles r ON ur.id_rol = r.id_rol
         WHERE ur.id_usuario = $1 AND r.nombre_rol = 'administrador'`,
        [req.user.id_usuario],
      )

      if (adminCheck.rows.length > 0) {
        return next() // Admin tiene acceso a todo
      }

      // Si no es admin, verificar permisos específicos del módulo
      const permissionResult = await pool.query(
        `SELECT DISTINCT rp.id_permiso, p.nombre_permiso
         FROM usuario_roles ur
         JOIN rol_permisos rp ON ur.id_rol = rp.id_rol
         JOIN permisos p ON rp.id_permiso = p.id_permiso
         WHERE ur.id_usuario = $1 AND p.nombre_permiso = $2`,
        [req.user.id_usuario, moduleName],
      )

      if (permissionResult.rows.length === 0) {
        return res.status(403).json({
          message: `Acceso denegado al módulo: ${moduleName}`,
        })
      }

      next()
    } catch (err) {
      console.error("Authorization error:", err)
      res.status(500).json({ message: "Error en autorización", error: err.message })
    }
  }
}

export function requireRole(roleName) {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Usuario no autenticado" })
      }

      const roleCheck = await pool.query(
        `SELECT ur.id_rol FROM usuario_roles ur
         JOIN roles r ON ur.id_rol = r.id_rol
         WHERE ur.id_usuario = $1 AND r.nombre_rol = $2`,
        [req.user.id_usuario, roleName],
      )

      if (roleCheck.rows.length === 0) {
        return res.status(403).json({
          message: `Se requiere rol: ${roleName}`,
        })
      }

      next()
    } catch (err) {
      console.error("Role check error:", err)
      res.status(500).json({ message: "Error verificando rol", error: err.message })
    }
  }
}
