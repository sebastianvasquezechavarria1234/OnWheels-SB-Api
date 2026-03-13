import pool from "../db/postgresPool.js";

async function inspectVentas() {
    try {
        console.log("--- VENTAS COLUMNS ---");
        const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'ventas'");
        console.log(res.rows.map(r => r.column_name));
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

inspectVentas();
