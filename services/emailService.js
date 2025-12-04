// services/emailMasivoServices.js
const API_URL = "http://localhost:3000/api/correos-masivos";

// ✅ Obtener usuarios por rol
export const getUsuariosPorRol = async (rol) => {
  const res = await fetch(`${API_URL}/usuarios-por-rol?rol=${rol}`);
  if (!res.ok) throw new Error("Error al obtener usuarios");
  return await res.json();
};

// ✅ Obtener todos los roles disponibles
export const getRolesDisponibles = async () => {
  const res = await fetch(`${API_URL}/roles`);
  if (!res.ok) throw new Error("Error al obtener roles");
  return await res.json();
};

// ✅ Enviar correo masivo por roles
export const enviarCorreoMasivoPorRoles = async (data) => {
  const res = await fetch(`${API_URL}/enviar-por-roles`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al enviar correos");
  return await res.json();
};

// ✅ Obtener historial de envíos
export const getHistorialEnvios = async () => {
  const res = await fetch(`${API_URL}/historial`);
  if (!res.ok) throw new Error("Error al obtener historial");
  return await res.json();
};

// ✅ Obtener detalles de un envío
export const getDetalleEnvio = async (id) => {
  const res = await fetch(`${API_URL}/historial/${id}`);
  if (!res.ok) throw new Error("Error al obtener detalles");
  return await res.json();
};