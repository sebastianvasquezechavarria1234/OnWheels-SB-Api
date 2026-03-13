import pool from '../db/postgresPool.js';

async function testVenta() {
    try {
        const vars = await pool.query('SELECT v.id_variante, v.stock, p.precio_venta FROM variantes_producto v JOIN productos p ON v.id_producto = p.id_producto WHERE v.stock > 0 LIMIT 1');
        const u = await pool.query('SELECT id_usuario, correo_electronico FROM usuarios LIMIT 1');

        console.log('Vars:', vars.rows[0]);
        console.log('User:', u.rows[0]);

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            let id_cliente;
            const crc = await client.query('SELECT id_cliente FROM clientes WHERE id_usuario = $1', [u.rows[0].id_usuario]);

            if (crc.rows.length === 0) {
                const nc = await client.query('INSERT INTO clientes (id_usuario, direccion_envio, telefono_contacto) VALUES ($1, $2, $3) RETURNING id_cliente', [u.rows[0].id_usuario, 'DIR TEST', '1234567']);
                id_cliente = nc.rows[0].id_cliente;
            } else {
                id_cliente = crc.rows[0].id_cliente;
            }
            console.log('Cliente ID:', id_cliente);

            const q = 'INSERT INTO ventas (id_cliente, metodo_pago, estado, fecha_venta, total) VALUES ($1, $2, $3, $4, $5) RETURNING id_venta';
            const vals = [id_cliente, 'Efectivo', 'Pendiente', new Date(), vars.rows[0].precio_venta];

            const vr = await client.query(q, vals);
            const id_venta = vr.rows[0].id_venta;
            console.log('Venta insertada:', id_venta);

            await client.query(
                'INSERT INTO detalle_ventas (id_venta, id_variante, cantidad, precio_unitario) VALUES ($1, $2, $3, $4)',
                [id_venta, vars.rows[0].id_variante, 1, vars.rows[0].precio_venta]
            );
            console.log('Detalle insertado');

            await client.query(
                'UPDATE variantes_producto SET stock = stock - $1 WHERE id_variante = $2',
                [1, vars.rows[0].id_variante]
            );
            console.log('Stock actualizado');

            await client.query('ROLLBACK');
            console.log('Prueba exitosa - Haciendo Rollback');
        } catch (e) {
            await client.query('ROLLBACK');
            console.error('Error insertando venta:', e.message);
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('Error setup', err.message);
    } finally {
        pool.end();
    }
}

testVenta();
