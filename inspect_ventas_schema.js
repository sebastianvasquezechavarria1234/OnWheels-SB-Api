import pool from "./db/postgresPool.js";

async function inspectTables() {
    try {
        console.log("--- ROLES ---");
        const roles = await pool.query('SELECT * FROM roles');
        console.log(roles.rows);

        console.log("--- PRODUCTOS COLUMNS ---");
        const prod = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'productos'");
        console.log(prod.rows.map(r => r.column_name));

        console.log("--- VARIANTES_PRODUCTO COLUMNS ---");
        const vars = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'variantes_producto'");
        console.log(vars.rows.map(r => r.column_name));
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

inspectTables();
