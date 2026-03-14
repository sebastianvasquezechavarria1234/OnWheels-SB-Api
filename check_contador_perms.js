
import pool from "./db/postgresPool.js";

async function checkPerms() {
    try {
        const id_rol = 13; // contador
        const res = await pool.query(`
            SELECT p.nombre_permiso 
            FROM permisos p
            JOIN roles_permisos rp ON p.id_permiso = rp.id_permiso
            WHERE rp.id_rol = $1
        `, [id_rol]);
        console.log("PERMISOS CONTADOR:", res.rows.map(r => r.nombre_permiso));
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkPerms();
