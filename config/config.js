require('dotenv').config();          // <- reads .env into process.env

module.exports = {
  development: {
    username: process.env.DB_USER || 'root',
    password: process.env.SQLPASSWORD,
    database: process.env.DB_NAME || 'evolve',
    host: process.env.DB_HOST || '127.0.0.1',
    dialect: 'mysql',
    logging: false
  },
  test: {
    username: 'root',
    password: process.env.SQLPASSWORD,
    database: 'evolve_test',
    host: '127.0.0.1',
    dialect: 'mysql',
    logging: false
  },
  production: {
    username: process.env.DB_USER || 'root',
    password: process.env.SQLPASSWORD,
    database: 'evolve',
    host: process.env.DB_HOST || '127.0.0.1',
    dialect: 'mysql',
    logging: false
  }
};
