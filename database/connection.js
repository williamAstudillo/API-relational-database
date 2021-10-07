const { Sequelize } = require('sequelize')
require('dotenv').config()
const { DB_NAME, DB_USER, DB_PASSWORD } = process.env;
const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
    dialect: 'mssql',
    host: 'localhost'
})

module.exports = sequelize