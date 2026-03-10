import pool from './db/postgresPool.js';

async function checkCols() {
    try {
        const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'productos'");
        console.log('Columns in productos:', res.rows.map(r => r.column_name));

        const res2 = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'variantes_producto'");
        console.log('Columns in variantes_producto:', res2.rows.map(r => r.column_name));

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

checkCols();
