
import pool from './db/postgresPool.js';
const id = 8;
async function check() {
  console.log('--- Diagnosis for Product ID 30 ---');
  try {
    const r1 = await pool.query('SELECT COUNT(*) FROM detalle_ventas WHERE id_variante IN (SELECT id_variante FROM variantes_producto WHERE id_producto = $1)', [id]);
    console.log('Ventas references:', r1.rows[0].count);
  } catch(e) { console.error('Ventas check failed:', e.message); }
  
  try {
    const r2 = await pool.query('SELECT COUNT(*) FROM detalle_compras WHERE id_producto = $1', [id]);
    console.log('Compras references:', r2.rows[0].count);
  } catch(e) { console.error('Compras check failed:', e.message); }

  try {
    const r3 = await pool.query('SELECT COUNT(*) FROM variantes_producto WHERE id_producto = $1', [id]);
    console.log('Variants count:', r3.rows[0].count);
  } catch(e) { console.error('Variants check failed:', e.message); }

  process.exit();
}
check();
