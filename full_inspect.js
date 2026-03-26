import pool from "./db/postgresPool.js";

async function run() {
    try {
        const res = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'usuarios'");
        console.log("Full columns list:");
        res.rows.forEach(row => console.log(`- ${row.column_name}: ${row.data_type}`));
    } finally {
        process.exit();
    }
}
run();
