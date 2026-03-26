import pool from "./db/postgresPool.js";

async function run() {
    try {
        await pool.query("ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS foto_perfil character varying(255)");
        await pool.query("ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS direccion character varying(255)");
        await pool.query("ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS fecha_nacimiento date");
        console.log("Columnas verificadas/añadidas.");
    } catch(e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
run();
