
import pool from './db/postgresPool.js';
const ids = [5, 7, 8, 30];
async function check() {
  for (const id of ids) {
    console.log(`--- Diagnosis for Product ID ${id} ---`);
    try {
      const r1 = await pool.query('SELECT COUNT(*) FROM detalle_ventas WHERE id_variante IN (SELECT id_variante FROM variantes_producto WHERE id_producto = $1)', [id]);
      console.log(`Ventas references: ${r1.rows[0].count}`);
    } catch(e) { console.error('Ventas check failed:', e.message); }
    
    try {
      const r2 = await pool.query('SELECT COUNT(*) FROM detalle_compras WHERE id_producto = $1', [id]);
      console.log(`Compras references: ${r2.rows[0].count}`);
    } catch(e) { console.error('Compras check failed:', e.message); }
  }
  process.exit();
}
check();
