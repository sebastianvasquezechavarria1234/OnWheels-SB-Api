import fetch from 'node-fetch';

const API_URL = "http://localhost:3000/api/productos";

(async () => {
  try {
    console.log("Consultando productos en:", API_URL);
    const res = await fetch(API_URL);
    
    if (res.ok) {
      const data = await res.json();
      console.log(`✅ ÉXITO: Se obtuvieron ${data.length} productos.`);
      if (data.length > 0) {
        console.log("Ejemplo de primer producto:", JSON.stringify(data[0], null, 2));
      } else {
        console.log("⚠️ La lista de productos está vacía (verifica tu DB y que 'estado = true').");
      }
    } else {
      console.error("❌ ERROR: El servidor respondió con estado:", res.status);
      console.error("Respuesta:", await res.text());
    }
  } catch (err) {
    console.error("❌ ERROR DE CONEXIÓN: No se pudo conectar al servidor.", err.message);
  }
})();
