
import pool from './db/postgresPool.js';

async function diagnose() {
  try {
    const totalVentasRes = await pool.query('SELECT COUNT(*) FROM ventas');
    console.log('Total Ventas in table:', totalVentasRes.rows[0].count);

    const nulls = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE metodo_pago IS NULL) as null_mp,
        COUNT(*) FILTER (WHERE estado IS NULL) as null_st,
        COUNT(*) FILTER (WHERE id_cliente IS NULL) as null_cli
      FROM ventas
    `);
    console.log('NULL counts in ventas:');
    console.table(nulls.rows);

    const orphUser = await pool.query(`
      SELECT COUNT(*) 
      FROM ventas v
      INNER JOIN clientes c ON v.id_cliente = c.id_cliente
      LEFT JOIN usuarios u ON c.id_usuario = u.id_usuario
      WHERE u.id_usuario IS NULL
    `);
    console.log('Ventas with Client but NO User (Join breaker):', orphUser.rows[0].count);

    const orphCli = await pool.query(`
      SELECT COUNT(*) 
      FROM ventas v
      LEFT JOIN clientes c ON v.id_cliente = c.id_cliente
      WHERE c.id_cliente IS NULL
    `);
    console.log('Ventas with NO Client (Join breaker):', orphCli.rows[0].count);

    const results = await pool.query(`
      SELECT id_venta, metodo_pago, estado, id_cliente FROM ventas WHERE metodo_pago IS NULL OR estado IS NULL
    `);
    if(results.rows.length > 0) {
      console.log('Records with NULL metodo_pago or estado:');
      console.table(results.rows);
    }

    // NEW TEST: All records that don't match either CRUD
    const hidden = await pool.query(`
      SELECT v.id_venta, v.metodo_pago, v.estado
      FROM ventas v
      WHERE v.id_venta NOT IN (
        SELECT v2.id_venta FROM ventas v2
        INNER JOIN clientes c ON v2.id_cliente = c.id_cliente
        INNER JOIN usuarios u ON c.id_usuario = u.id_usuario
        WHERE (LOWER(v2.metodo_pago) NOT IN ('contraentrega') OR (LOWER(v2.metodo_pago) = 'contraentrega' AND LOWER(v2.estado) IN ('entregada', 'cancelada')) OR LOWER(v2.estado) = 'cancelada')
      )
      AND v.id_venta NOT IN (
        SELECT v3.id_venta FROM ventas v3
        INNER JOIN clientes c ON v3.id_cliente = c.id_cliente
        INNER JOIN usuarios u ON v3.id_cliente = c.id_cliente -- wait, join is v3.id_cliente = c.id_cliente
        INNER JOIN usuarios u2 ON c.id_usuario = u2.id_usuario
        WHERE LOWER(v3.metodo_pago) = 'contraentrega' AND LOWER(v3.estado) NOT IN ('entregada', 'cancelada')
      )
    `);
    console.log('Total Hidden Records found by comprehensive check:', hidden.rows.length);
    if(hidden.rows.length > 0) console.table(hidden.rows);

  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

diagnose();
