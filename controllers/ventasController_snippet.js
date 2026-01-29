
// ✅ Actualizar estado de venta (sin modificar items)
export const updateVentaStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;

        if (!estado) return res.status(400).json({ mensaje: "Estado requerido" });

        // Validar estados permitidos
        const estadosValidos = ["Pendiente", "Procesada", "Enviada", "Entregada", "Cancelada"];
        if (!estadosValidos.includes(estado)) {
            return res.status(400).json({ mensaje: "Estado inválido" });
        }

        const result = await pool.query(
            "UPDATE ventas SET estado = $1 WHERE id_venta = $2 RETURNING *",
            [estado, id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ mensaje: "Venta no encontrada" });
        }

        res.json({ mensaje: "Estado actualizado", venta: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ mensaje: "Error del servidor" });
    }
};
