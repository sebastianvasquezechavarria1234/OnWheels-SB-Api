import pool from "./db/postgresPool.js";

async function addJustificacionColumn() {
    try {
        console.log("--- ADDING justificacion_cancelacion COLUMN ---");
        await pool.query("ALTER TABLE ventas ADD COLUMN IF NOT EXISTS justificacion_cancelacion TEXT");
        console.log("Column added or already exists.");
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

addJustificacionColumn();
