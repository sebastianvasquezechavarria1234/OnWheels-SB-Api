// scripts/seedColores.js
// Ejecutar con: node scripts/seedColores.js
import pool from "../db/postgresPool.js";

const colores = [
  { nombre_color: "Blanco",          codigo_hex: "#FFFFFF" },
  { nombre_color: "Negro",           codigo_hex: "#000000" },
  { nombre_color: "Gris",            codigo_hex: "#808080" },
  { nombre_color: "Gris Claro",      codigo_hex: "#D3D3D3" },
  { nombre_color: "Gris Oscuro",     codigo_hex: "#404040" },
  { nombre_color: "Rojo",            codigo_hex: "#FF0000" },
  { nombre_color: "Rojo Oscuro",     codigo_hex: "#8B0000" },
  { nombre_color: "Naranja",         codigo_hex: "#FF6600" },
  { nombre_color: "Amarillo",        codigo_hex: "#FFD700" },
  { nombre_color: "Beige",           codigo_hex: "#F5F0DC" },
  { nombre_color: "Café",            codigo_hex: "#8B5E3C" },
  { nombre_color: "Café Oscuro",     codigo_hex: "#4B2F1A" },
  { nombre_color: "Verde",           codigo_hex: "#008000" },
  { nombre_color: "Verde Claro",     codigo_hex: "#90EE90" },
  { nombre_color: "Verde Oscuro",    codigo_hex: "#006400" },
  { nombre_color: "Verde Militar",   codigo_hex: "#4B5320" },
  { nombre_color: "Azul",            codigo_hex: "#0000FF" },
  { nombre_color: "Azul Claro",      codigo_hex: "#ADD8E6" },
  { nombre_color: "Azul Oscuro",     codigo_hex: "#00008B" },
  { nombre_color: "Azul Navy",       codigo_hex: "#001F5B" },
  { nombre_color: "Azul Rey",        codigo_hex: "#4169E1" },
  { nombre_color: "Celeste",         codigo_hex: "#87CEEB" },
  { nombre_color: "Morado",          codigo_hex: "#800080" },
  { nombre_color: "Lila",            codigo_hex: "#C8A2C8" },
  { nombre_color: "Violeta",         codigo_hex: "#EE82EE" },
  { nombre_color: "Rosa",            codigo_hex: "#FFC0CB" },
  { nombre_color: "Rosa Fuerte",     codigo_hex: "#FF1493" },
  { nombre_color: "Fucsia",          codigo_hex: "#FF00FF" },
  { nombre_color: "Turquesa",        codigo_hex: "#40E0D0" },
  { nombre_color: "Aqua",            codigo_hex: "#00FFFF" },
  { nombre_color: "Dorado",          codigo_hex: "#FFD700" },
  { nombre_color: "Plateado",        codigo_hex: "#C0C0C0" },
  { nombre_color: "Crema",           codigo_hex: "#FFFDD0" },
  { nombre_color: "Vino",            codigo_hex: "#722F37" },
  { nombre_color: "Salmon",          codigo_hex: "#FA8072" },
  { nombre_color: "Coral",           codigo_hex: "#FF7F50" },
  { nombre_color: "Mostaza",         codigo_hex: "#E3A92A" },
  { nombre_color: "Terracota",       codigo_hex: "#C0614A" },
];

async function seedColores() {
  let insertados = 0;
  let omitidos = 0;

  console.log(`\n🎨 Iniciando seed de ${colores.length} colores...\n`);

  for (const color of colores) {
    try {
      const existing = await pool.query(
        "SELECT id_color FROM colores WHERE nombre_color = $1",
        [color.nombre_color]
      );

      if (existing.rows.length > 0) {
        console.log(`  ⚠️  Ya existe: ${color.nombre_color}`);
        omitidos++;
      } else {
        await pool.query(
          "INSERT INTO colores (nombre_color, codigo_hex) VALUES ($1, $2)",
          [color.nombre_color, color.codigo_hex]
        );
        console.log(`  ✅ Insertado: ${color.nombre_color} (${color.codigo_hex})`);
        insertados++;
      }
    } catch (err) {
      console.error(`  ❌ Error con ${color.nombre_color}:`, err.message);
    }
  }

  console.log(`\n📊 Resultado:`);
  console.log(`   ✅ Insertados: ${insertados}`);
  console.log(`   ⚠️  Omitidos (ya existían): ${omitidos}`);
  console.log(`\n✔️  Seed de colores completado.\n`);

  await pool.end();
}

seedColores();
