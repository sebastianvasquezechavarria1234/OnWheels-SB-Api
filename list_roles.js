
import pool from "./db/postgresPool.js";

async function listRoles() {
    try {
        const res = await pool.query('SELECT * FROM roles');
        console.log("ROLES:", JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

listRoles();
