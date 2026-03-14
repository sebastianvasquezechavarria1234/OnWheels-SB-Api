
import pool from "./db/postgresPool.js";

async function verify() {
    try {
        console.log("Verifying backend class image support...");
        
        // Fetch valid level and sede
        const levelRes = await pool.query("SELECT id_nivel FROM niveles_clases LIMIT 1");
        const sedeRes = await pool.query("SELECT id_sede FROM sedes LIMIT 1");
        
        if (levelRes.rowCount === 0 || sedeRes.rowCount === 0) {
            console.log("❌ FAILURE: No levels or sedes found in database. Cannot run test.");
            return;
        }
        
        const id_nivel = levelRes.rows[0].id_nivel;
        const id_sede = sedeRes.rows[0].id_sede;

        // 1. Check if we can insert a class with url_imagen
        const testClass = {
            id_nivel,
            id_sede,
            descripcion: "Test Image Class",
            url_imagen: "https://example.com/image.jpg"
        };
        
        const res = await pool.query(
            "INSERT INTO clases (id_nivel, id_sede, descripcion, url_imagen) VALUES ($1, $2, $3, $4) RETURNING *",
            [testClass.id_nivel, testClass.id_sede, testClass.descripcion, testClass.url_imagen]
        );
        
        console.log("Inserted class:", res.rows[0]);
        
        if (res.rows[0].url_imagen === testClass.url_imagen) {
            console.log("✅ SUCCESS: url_imagen stored correctly.");
        } else {
            console.log("❌ FAILURE: url_imagen mismatch.");
        }
        
        // Cleanup
        await pool.query("DELETE FROM clases WHERE id_clase = $1", [res.rows[0].id_clase]);
        console.log("Cleanup done.");

    } catch (err) {
        console.error("Verification failed:", err);
    } finally {
        process.exit();
    }
}

verify();
