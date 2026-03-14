
import pool from "./db/postgresPool.js";

async function checkFull() {
    try {
        const res = await pool.query(`
            SELECT 
                column_name, 
                data_type, 
                is_nullable, 
                column_default
            FROM information_schema.columns 
            WHERE table_name = 'proveedores'
        `);
        console.log("COLUMNS:", JSON.stringify(res.rows, null, 2));

        const pks = await pool.query(`
            SELECT a.attname
            FROM   pg_index i
            JOIN   pg_attribute a ON a.attrelid = i.indrelid
                                 AND a.attnum = ANY(i.indkey)
            WHERE  i.indrelid = 'proveedores'::regclass
            AND    i.indisprimary;
        `);
        console.log("PKS:", JSON.stringify(pks.rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkFull();
