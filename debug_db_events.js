import pool from "./db/postgresPool.js";

async function checkEvents() {
    try {
        console.log("--- All Events ---");
        const allEvents = await pool.query("SELECT id_evento, nombre_evento, fecha_evento, estado, id_categoria_evento, id_sede FROM eventos");
        console.log(JSON.stringify(allEvents.rows, null, 2));

        console.log("\n--- Categories ---");
        const categories = await pool.query("SELECT * FROM categorias_eventos");
        console.log(JSON.stringify(categories.rows, null, 2));

        console.log("\n--- Sedes ---");
        const sedes = await pool.query("SELECT * FROM sedes");
        console.log(JSON.stringify(sedes.rows, null, 2));

        console.log("\n--- Future Events (Backend Logic) ---");
        const sql = `
            SELECT e.id_evento, e.nombre_evento, e.fecha_evento, e.estado, ce.nombre_categoria, s.nombre_sede
            FROM eventos e
            INNER JOIN categorias_eventos ce ON e.id_categoria_evento = ce.id_categoria_evento
            INNER JOIN sedes s ON e.id_sede = s.id_sede
            WHERE e.fecha_evento >= CURRENT_DATE AND e.estado = 'activo'
            ORDER BY e.fecha_evento, e.hora_inicio
            LIMIT 10;
        `;
        const futureEvents = await pool.query(sql);
        console.log(JSON.stringify(futureEvents.rows, null, 2));

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkEvents();
