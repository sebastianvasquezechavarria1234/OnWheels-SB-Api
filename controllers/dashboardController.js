// controllers/dashboardController.js
import pool from "../db/postgresPool.js";

export const getDashboardStats = async (req, res) => {
  try {
    // ─── 1. Ventas totales (excl. Canceladas) ──────────────────────────────────
    const ventasTotalesRes = await pool.query(`
      SELECT COALESCE(SUM(total), 0) AS total_ventas
      FROM ventas
      WHERE LOWER(estado) != 'cancelada'
    `);
    const totalVentas = parseFloat(ventasTotalesRes.rows[0].total_ventas);

    // ─── 2. Ventas del mes actual y del mes anterior (para % crecimiento) ──────
    const ventasMesRes = await pool.query(`
      SELECT
        COALESCE(SUM(CASE WHEN DATE_TRUNC('month', fecha_venta) = DATE_TRUNC('month', CURRENT_DATE) THEN total ELSE 0 END), 0) AS mes_actual,
        COALESCE(SUM(CASE WHEN DATE_TRUNC('month', fecha_venta) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month') THEN total ELSE 0 END), 0) AS mes_anterior
      FROM ventas
      WHERE LOWER(estado) != 'cancelada'
    `);
    const mesActual = parseFloat(ventasMesRes.rows[0].mes_actual);
    const mesAnterior = parseFloat(ventasMesRes.rows[0].mes_anterior);
    const tendenciaVentas = mesAnterior > 0
      ? Math.round(((mesActual - mesAnterior) / mesAnterior) * 100 * 10) / 10
      : mesActual > 0 ? 100 : 0;

    // ─── 3. Matrículas activas ─────────────────────────────────────────────────
    const matriculasActivasRes = await pool.query(`
      SELECT COUNT(*) AS total FROM matriculas WHERE estado = 'Activa'
    `);
    const matriculasActivas = parseInt(matriculasActivasRes.rows[0].total);

    // Matrículas activas mes actual vs anterior
    const matriculasMesRes = await pool.query(`
      SELECT
        COUNT(CASE WHEN DATE_TRUNC('month', fecha_inicio) = DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) AS mes_actual,
        COUNT(CASE WHEN DATE_TRUNC('month', fecha_inicio) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month') THEN 1 END) AS mes_anterior
      FROM matriculas
      WHERE LOWER(estado) = 'activa'
    `);
    const mActual = parseInt(matriculasMesRes.rows[0].mes_actual);
    const mAnterior = parseInt(matriculasMesRes.rows[0].mes_anterior);
    const tendenciaMatriculas = mAnterior > 0
      ? Math.round(((mActual - mAnterior) / mAnterior) * 100 * 10) / 10
      : mActual > 0 ? 100 : 0;

    // ─── 4. Preinscripciones pendientes ───────────────────────────────────────
    const preinscripcionesRes = await pool.query(`
      SELECT COUNT(*) AS total FROM estudiantes WHERE LOWER(estado) = 'pendiente'
    `);
    const preinscripciones = parseInt(preinscripcionesRes.rows[0].total);

    // Preinscripciones mes actual vs anterior
    const preinsMesRes = await pool.query(`
      SELECT
        COUNT(CASE WHEN DATE_TRUNC('month', fecha_preinscripcion) = DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) AS mes_actual,
        COUNT(CASE WHEN DATE_TRUNC('month', fecha_preinscripcion) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month') THEN 1 END) AS mes_anterior
      FROM estudiantes
    `);
    const pActual = parseInt(preinsMesRes.rows[0].mes_actual);
    const pAnterior = parseInt(preinsMesRes.rows[0].mes_anterior);
    const tendenciaPreins = pAnterior > 0
      ? Math.round(((pActual - pAnterior) / pAnterior) * 100 * 10) / 10
      : pActual > 0 ? 100 : 0;

    // ─── 5. Nuevos alumnos este mes (estudiantes aceptados en el mes actual) ───
    const nuevosAlumnosRes = await pool.query(`
      SELECT COUNT(*) AS total
      FROM estudiantes
      WHERE LOWER(estado) = 'activo'
        AND DATE_TRUNC('month', fecha_preinscripcion) = DATE_TRUNC('month', CURRENT_DATE)
    `);
    const nuevosAlumnos = parseInt(nuevosAlumnosRes.rows[0].total);

    // ─── 6. Ventas por mes (año actual para la gráfica de área) ───────────────
    const ventasPorMesRes = await pool.query(`
      SELECT
        TO_CHAR(fecha_venta, 'Mon') AS mes,
        EXTRACT(MONTH FROM fecha_venta) AS num_mes,
        COALESCE(SUM(total), 0) AS ventas
      FROM ventas
      WHERE LOWER(estado) != 'cancelada'
        AND EXTRACT(YEAR FROM fecha_venta) = EXTRACT(YEAR FROM CURRENT_DATE)
      GROUP BY mes, num_mes
      ORDER BY num_mes ASC
    `);

    const mesesEsp = {
      Jan: 'Ene', Feb: 'Feb', Mar: 'Mar', Apr: 'Abr', May: 'May', Jun: 'Jun',
      Jul: 'Jul', Aug: 'Ago', Sep: 'Sep', Oct: 'Oct', Nov: 'Nov', Dec: 'Dic'
    };

    const ventasPorMes = ventasPorMesRes.rows.map(r => ({
      month: mesesEsp[r.mes.trim()] || r.mes.trim(),
      sales: parseFloat(r.ventas)
    }));

    // ─── 7. Distribución por categoría de producto (top 4) ────────────────────
    const categoriasRes = await pool.query(`
      SELECT
        cp.nombre_categoria AS name,
        COALESCE(SUM(dv.cantidad), 0) AS value
      FROM categorias_productos cp
      LEFT JOIN productos p ON p.id_categoria = cp.id_categoria
      LEFT JOIN variantes_producto vp ON vp.id_producto = p.id_producto
      LEFT JOIN detalle_ventas dv ON dv.id_variante = vp.id_variante
      LEFT JOIN ventas v ON dv.id_venta = v.id_venta AND LOWER(v.estado) != 'cancelada'
      GROUP BY cp.id_categoria, cp.nombre_categoria
      ORDER BY value DESC
      LIMIT 4
    `);

    // Calcular porcentajes del donut
    const totalUnidades = categoriasRes.rows.reduce((acc, r) => acc + parseFloat(r.value), 0);
    const categorias = categoriasRes.rows.map(r => ({
      name: r.name,
      value: totalUnidades > 0
        ? Math.round((parseFloat(r.value) / totalUnidades) * 100)
        : 0,
      cantidad: parseInt(r.value)
    }));

    // ─── 8. Pedidos pendientes ─────────────────────────────────────────────────
    const pedidosPendRes = await pool.query(`
      SELECT COUNT(*) AS total FROM ventas WHERE LOWER(estado) = 'pendiente'
    `);
    const pedidosPendientes = parseInt(pedidosPendRes.rows[0].total);

    // ─── Respuesta final ───────────────────────────────────────────────────────
    res.json({
      metricas: {
        totalVentas,
        tendenciaVentas,
        matriculasActivas,
        tendenciaMatriculas,
        preinscripciones,
        tendenciaPreins,
        nuevosAlumnos,
        pedidosPendientes
      },
      ventasPorMes,
      categorias
    });

  } catch (err) {
    console.error("Error en getDashboardStats:", err);
    res.status(500).json({ mensaje: "Error al obtener estadísticas del dashboard", error: err.message });
  }
};
