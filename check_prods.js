
import pool from './db/postgresPool.js';

async function checkProducts() {
  try {
    const prods = await pool.query('SELECT COUNT(*) FROM productos');
    const vars = await pool.query('SELECT COUNT(*) FROM variantes_producto');
    console.log('Total Products:', prods.rows[0].count);
    console.log('Total Variants:', vars.rows[0].count);

    if (prods.rows[0].count > 0) {
      const sample = await pool.query('SELECT id_producto, nombre_producto, id_categoria FROM productos LIMIT 5');
      console.log('Sample Products:');
      console.table(sample.rows);
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

checkProducts();
