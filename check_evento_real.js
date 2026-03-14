import pool from "./db/postgresPool.js";

(async () => {
  try {
    const res = await pool.query(`SELECT id_evento, nombre_evento, descripcion, imagen FROM eventos LIMIT 3;`);
    console.log("Datos de eventos:");
    res.rows.forEach(r => {
      console.log("---");
      console.log("ID:", r.id_evento);
      console.log("Nombre:", r.nombre_evento);
      console.log("Descripcion:", r.descripcion);
      console.log("Imagen:", r.imagen);
    });
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
})();
