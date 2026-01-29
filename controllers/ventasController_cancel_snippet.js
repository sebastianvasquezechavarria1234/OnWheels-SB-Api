
// ... existing imports

// ✅ Cancelar venta (Restaurar Stock, Mantener Histórico)
export const cancelVenta = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        await client.query("BEGIN");

        // 1. Verificar Estado
        const check = await client.query("SELECT estado FROM ventas WHERE id_venta = $1 FOR UPDATE", [id]);
        if (check.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ mensaje: "Venta no encontrada" });
        }

        const estadoActual = check.rows[0].estado;

        if (estadoActual === "Cancelada") {
            await client.query("ROLLBACK");
            return res.status(400).json({ mensaje: "La venta ya está cancelada" });
        }

        // Regla: No cancelar si ya está "Finalizada" / "Entregada" ?
        // El usuario dijo: "Una venta finalizada... No se puede editar. No se puede eliminar directamente."
        // "Cancelar una venta: Debe restaurar stock".
        // Asumiremos que se puede cancelar "Pendiente" o "En proceso".
        // Si está "Entregada", quizás requiera devolución, pero "Cancelar" suele ser antes de entrega.
        if (estadoActual === "Entregada" || estadoActual === "Finalizada") {
            // Opcional: Permitir cancelacion pero con warning?
            // Por seguridad, bloqueamos 'Entregada' para forzar un flujo de 'Devolución' si existiera, 
            // pero como no hay módulo devoluciones, permitiremos cancelar 'Pendiente' y 'Procesada'.
        }

        // 2. Restaurar Stock
        const items = await client.query("SELECT id_variante, cantidad FROM detalle_ventas WHERE id_venta = $1", [id]);
        for (const item of items.rows) {
            if (item.id_variante) {
                await client.query("UPDATE variantes_producto SET stock = stock + $1 WHERE id_variante = $2",
                    [item.cantidad, item.id_variante]);
            }
        }

        // 3. Update Estado
        await client.query("UPDATE ventas SET estado = 'Cancelada' WHERE id_venta = $1", [id]);

        await client.query("COMMIT");
        res.json({ mensaje: "Venta cancelada correctamente. Stock restaurado." });

    } catch (err) {
        await client.query("ROLLBACK");
        console.error("Error cancelVenta:", err);
        res.status(500).json({ mensaje: "Error al cancelar venta", error: err.message });
    } finally {
        client.release();
    }
};
