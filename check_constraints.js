import pool from './db/postgresPool.js';

async function checkConstraints() {
    try {
        const res = await pool.query(`
      SELECT column_name, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'clientes'
    `);
        console.log('Clientes constraints:', res.rows);
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

checkConstraints();
