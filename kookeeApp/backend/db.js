const { Pool } = require('pg');

// Use environment variables for production
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'kookee',
    password: process.env.DB_PASSWORD || 'Kmantalgo#1',
    port: process.env.DB_PORT || 5432,
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool
};
