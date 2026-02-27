import pool from "../db/postgresPool.js";

// ✅ Obtener todos los pedidos (estado 'Pendiente')
export const getPedidos = async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT 
        v.id_venta,
        v.id_cliente,
        v.metodo_pago,
        v.estado AS estado,
        v.fecha_venta,
        v.total,
        c.id_usuario,
        u.nombre_completo AS nombre_cliente,
        u.email,
        u.documento,
        c.direccion_envio
      FROM ventas v
      INNER JOIN clientes c ON v.id_cliente = c.id_cliente
      INNER JOIN usuarios u ON c.id_usuario = u.id_usuario
      WHERE v.estado = 'Pendiente'
      ORDER BY v.fecha_venta DESC
    `);

        // Obtener items de cada pedido
        const pedidosConItems = await Promise.all(
            result.rows.map(async (venta) => {
                const items = await pool.query(`
          SELECT 
            dv.id_detalle_venta,
            dv.id_variante,
            dv.cantidad,
            dv.precio_unitario,
            p.id_producto,
            p.nombre_producto,
            co.nombre_color,
            t.nombre_talla
          FROM detalle_ventas dv
          INNER JOIN variantes_producto var ON dv.id_variante = var.id_variante
          INNER JOIN productos p ON var.id_producto = p.id_producto
          LEFT JOIN colores co ON var.id_color = co.id_color
          LEFT JOIN tallas t ON var.id_talla = t.id_talla
          WHERE dv.id_venta = $1
        `, [venta.id_venta]);
                return { ...venta, items: items.rows };
            })
        );

        res.json(pedidosConItems);
    } catch (err) {
        console.error(err);
        res.status(500).json({ mensaje: "Error al obtener pedidos", error: err.message });
    }
};

// ✅ Obtener un pedido por ID (solo si es "Pendiente")
export const getPedidoById = async (req, res) => {
    try {
        const { id } = req.params;

        const ventaResult = await pool.query(`
      SELECT 
        v.id_venta,
        v.id_cliente,
        v.metodo_pago,
        v.estado AS estado,
        v.fecha_venta,
        v.total,
        u.id_usuario,
        u.nombre_completo AS nombre_cliente,
        u.email,
        u.telefono,
        u.documento,
        c.direccion_envio
      FROM ventas v
      INNER JOIN clientes c ON v.id_cliente = c.id_cliente
      INNER JOIN usuarios u ON c.id_usuario = u.id_usuario
      WHERE v.id_venta = $1 AND v.estado = 'Pendiente'
    `, [id]);

        if (ventaResult.rows.length === 0) {
            return res.status(404).json({ mensaje: "Pedido no encontrado o ya procesado" });
        }

        const venta = ventaResult.rows[0];

        const itemsResult = await pool.query(`
      SELECT 
        dv.id_detalle_venta,
        dv.id_variante,
        dv.cantidad,
        dv.precio_unitario,
        p.id_producto,
        p.nombre_producto,
        co.nombre_color,
        t.nombre_talla
      FROM detalle_ventas dv
      INNER JOIN variantes_producto var ON dv.id_variante = var.id_variante
      INNER JOIN productos p ON var.id_producto = p.id_producto
      LEFT JOIN colores co ON var.id_color = co.id_color
      LEFT JOIN tallas t ON var.id_talla = t.id_talla
      WHERE dv.id_venta = $1
    `, [id]);

        res.json({ ...venta, items: itemsResult.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ mensaje: "Error al obtener el pedido", error: err.message });
    }
};
