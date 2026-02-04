const db = require('./db');
async function run() {
    try {
        const res = await db.query("SELECT * FROM information_schema.columns WHERE table_name = 'products'");
        console.log(res.rows.map(c => c.column_name).join(', '));

        const sample = await db.query("SELECT * FROM products LIMIT 1");
        console.log('\nSample Row:');
        console.log(JSON.stringify(sample.rows[0], null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}
run();
