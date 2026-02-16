import pool from './db/postgresPool.js';

async function checkColumns() {
    try {
        const query = `
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name IN ('estudiantes', 'usuarios', 'acudientes');
    `;
        const res = await pool.query(query);
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(); // Force exit to close pool
    }
}

checkColumns();
