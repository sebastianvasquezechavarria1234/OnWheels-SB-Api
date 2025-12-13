import http from 'http';

const url = "http://localhost:3000/api/productos";

console.log("Consultando:", url);

http.get(url, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      try {
        const json = JSON.parse(data);
        console.log(`✅ ÉXITO: Se obtuvieron ${json.length} productos.`);
        if (json.length > 0) {
            console.log("Muestra del primero:", JSON.stringify(json[0], null, 2));
        } else {
            console.log("⚠️ Lista vacía (asegúrate de tener productos activos en DB).");
        }
      } catch (e) {
        console.error("Error parseando JSON:", e.message);
      }
    } else {
      console.error(`❌ Error HTTP: ${res.statusCode}`);
      console.log("Respuesta:", data);
    }
  });

}).on("error", (err) => {
  console.error("❌ Error de conexión:", err.message);
});
