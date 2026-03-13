import fetch from 'node-fetch';

const API_URL = "http://localhost:3000/api/eventos";

const testEvent = {
  id_categoria_evento: 1, // Asumiendo que existe ID 1
  id_sede: 1,             // Asumiendo que existe ID 1
  id_patrocinador: null,
  nombre_evento: "Evento de Prueba Automático",
  fecha_evento: "2025-12-25",
  hora_inicio: "10:00",
  hora_aproximada_fin: "12:00",
  descripcion: "Esto es una prueba de verificación",
  imagen: "https://via.placeholder.com/150",
  estado: "activo"
};

(async () => {
  try {
    console.log("Intentando crear evento en:", API_URL);
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testEvent)
    });

    if (res.ok) {
      const data = await res.json();
      console.log("✅ ÉXITO: Evento creado correctamente:", data);
    } else {
      const text = await res.text();
      console.error("❌ ERROR: El servidor respondió con estado:", res.status);
      console.error("Respuesta:", text);
    }
  } catch (err) {
    console.error("❌ ERROR DE CONEXIÓN: No se pudo conectar al servidor.", err.message);
  }
})();
