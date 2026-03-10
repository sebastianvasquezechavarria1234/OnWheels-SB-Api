import pool from './db/postgresPool.js';

async function checkColumns() {
    try {
        const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'usuarios'");
        console.log('Columns in usuarios:', res.rows.map(r => r.column_name));

        const res2 = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'clientes'");
        console.log('Columns in clientes:', res2.rows.map(r => r.column_name));

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

checkColumns();
