
import pool from "./db/postgresPool.js";

async function migrate() {
    try {
        await pool.query("ALTER TABLE clases ADD COLUMN IF NOT EXISTS url_imagen VARCHAR(500)");
        console.log("Column 'url_imagen' added successfully to 'clases' table");
    } catch (err) {
        console.error("Error during migration:", err);
    } finally {
        process.exit();
    }
}

migrate();
