// backend/middleware/adminOrPermission.js
export function adminOrPermission(requiredPermission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }

    // ✅ Acceso total si es administrador
    if (req.user.roles.includes('administrador')) {
      return next();
    }

    // ✅ Verificar permiso explícito (en minúsculas)
    if (req.user.permisos.includes(requiredPermission.toLowerCase())) {
      return next();
    }

    return res.status(403).json({
      message: `Acceso denegado. Se requiere el permiso: "${requiredPermission}" o ser administrador.`
    });
  };
}
