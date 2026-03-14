import pool from "./db/postgresPool.js";

async function dumpPermisos() {
    try {
        const res = await pool.query(`
      SELECT nombre_permiso, descripcion FROM permisos ORDER BY nombre_permiso
    `);
        console.log("Permissions:", res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

dumpPermisos();
