// Load environment variables
require('dotenv').config();

module.exports = {
    HOST: process.env.DB_HOST || 'localhost',
    PORT: process.env.DB_PORT || 3306,
    USER: process.env.DB_USER || 'root',
    PASSWORD: process.env.DB_PASSWORD || '',
    DATABASE: process.env.DB_NAME || 'evolve',
    DIALECT: process.env.DB_DIALECT || 'mysql',

    // Optional pool configuration
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
};