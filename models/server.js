const express = require('express');
const fileupload = require('express-fileupload');
const cors = require('cors');
const sequelize = require('../database/connection');

class Server {
  constructor() {
    this.app = express();
    this.middlewares();
    this.dbConnection();
    this.routes();
  }

  async dbConnection() {
    try {
      await sequelize.sync({ force: true });
    } catch (error) {
      console.log('error conectando base de datos ', error);
    }
  }

  middlewares() {
    this.app.use(cors());
    this.app.use(fileupload());
    this.app.use(express.json());
  }
  routes() {
    this.app.use('/dev', require('../routes/dev'));
    this.app.use('/register', require('../routes/register')); // REGISTRO DE LA EMPRESA
    this.app.use('/payments', require('../routes/payments')); // PAGOS DE NOMINA
    this.app.use('/novelties', require('../routes/novelties')); //NOVEDADES
    this.app.use('/payroll', require('../routes/payroll')); // EMPLEADO SOLICITE ADELANTO
    this.app.use('/getEnterpriseData', require('../routes/getEnterpriseData')); // OBTENER DATOS EMPRESA
    // this.app.use('/restricted', require('../routes/dev')) // AGREGAR EMPRESA A LISTAS RESTRICTIVAS
    this.app.use('/logs', require('../routes/logs')); // logs de un funcionario
    this.app.use('/getDataEmployees', require('../routes/getDataEmployees')); // Datos funcionarios
    this.app.use('/', require('../routes/session')); // inicio de sesion
  }

  listen() {
    this.app.listen(8080);
  }
}

module.exports = Server;
