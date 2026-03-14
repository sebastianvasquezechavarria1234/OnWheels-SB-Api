import pool from "../db/postgresPool.js";
import pool from './db/postgresPool.js';

const tables = ['ventas', 'usuarios', 'clientes'];

for (const table of tables) {
  const res = await pool.query(
    `SELECT column_name FROM information_schema.columns WHERE table_name = '${table}' ORDER BY ordinal_position`
  );
  console.log(`\n=== ${table} ===`);
  console.log(res.rows.map(r => r.column_name).join(', '));
}

process.exit(0);
