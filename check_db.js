
import pool from "./db/postgresPool.js";

async function checkTable() {
    try {
        const res = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'ventas'");
        console.log("COLUMNS IN VENTAS:");
        console.table(res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkTable();
