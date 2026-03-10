import pool from './db/postgresPool.js';
async function test() {
    try {
        const res = await pool.query(`
      SELECT 
        dv.id_detalle_venta,
        dv.id_variante,
        dv.cantidad,
        dv.precio_unitario,
        p.id_producto,
        p.nombre_producto
      FROM detalle_ventas dv
      INNER JOIN variantes_producto var ON dv.id_variante = var.id_variante
      INNER JOIN productos p ON var.id_producto = p.id_producto
      WHERE dv.id_venta = $1
    `, [21]);
        console.log('Items para id_venta 21:', res.rows);
    } catch (e) { console.error(e.message); } finally { pool.end(); }
}
test();
