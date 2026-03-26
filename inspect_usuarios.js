import pool from "./db/postgresPool.js";

async function run() {
    try {
        const res = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'usuarios'");
        console.log("Columns in 'usuarios' table:");
        res.rows.forEach(row => console.log(`${row.column_name}: ${row.data_type}`));
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}
run();
