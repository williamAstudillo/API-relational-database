const csvToJson = require('convert-csv-to-json');
const { Op } = require("sequelize");

const Account = require('../models/account');
const Customer = require('../models/customer');
const CustomerOperation = require('../models/customerOperation');
const EnterpriseProgram = require('../models/enterpriseProgram');
const moment = require("moment");

const {
  registerInFilesSentTable,
  registerInFilesDetails,
} = require('./functions/register');
const { isWrongStructure, validateDataEmployees, isEmpty, isNotValidName, isNotNumber } = require('./functions/utils');
const { isDaviplataAlreadyCreated, altaCliente } = require('./register');
const Payment = require('../models/payments');

// ################## utils functions ############################
const checkUserDataIsCorrect = async (employees, companyName, companyNit) => {
  let wrongUsers = []

  for (let index = 0; index < employees.length; index++) {
    
     const customerInfo = await Customer.findOne({
        where: {
          IDENTIFICATION_NUMBER: employees[index].numeroidentificacion,
        }
      })
      const accountInfo = await Account.findOne({
        where: {
          PRODUCT: employees[index].numeroidentificacion,
          SUBPRODUCT: employees[index].numerocelular,  
        }
      })
      if (!customerInfo || ! accountInfo) {
        wrongUsers.push(employees[index])
      }
      else {
        console.log(customerInfo)
        console.log(accountInfo)

      }
   
  }
  console.log("usuarios incorrefctosssss ", wrongUsers.length)
  return wrongUsers
}

const checkUsers = async (employees, companyName, companyNit) => {
  console.log("-----------------------checkeando si esta en otra compañia------------------")
  console.log(companyName)
  let userinAnotherCompany = []
  for (let index = 0; index < employees.length; index++) {

      const customerInfo = await Customer.findOne({
        where: {
          IDENTIFICATION_NUMBER: employees[index].numeroidentificacion,
        },
      });
      if (customerInfo) {
        if (customerInfo.NAME_ENTERPRISE !== companyName && customerInfo.NAME_ENTERPRISE !== "") {
          userinAnotherCompany.push(employees[index])
      }
    }
  }
  console.log("longh: ", userinAnotherCompany.length)
  return userinAnotherCompany
}

const userIsalreadyFired = async (employees) => {
  console.log("#########checjeando usuario ya retirado ###########")
  let usersFired = []
  for (let index = 0; index < employees.length; index++) {

    const customerInfo = await Customer.findOne({
      where: {
        IDENTIFICATION_NUMBER: employees[index].numeroidentificacion,
      },
    });
    const accountInfo = await Account.findOne({
      where: {
        PRODUCT: employees[index].numeroidentificacion,
        SUBPRODUCT: employees[index].numerocelular,
      },
    })
    if (customerInfo) {
      
      if (customerInfo.NAME_ENTERPRISE === "" && !accountInfo.PAYROLL_ADVANCE) {
        usersFired.push(employees[index])
      }
    }
  }
  return usersFired
}

const validateDataNovelties = (employees, uploadPath) => {
  if (uploadPath === './static/novedadesregistro.csv') {
    if(validateDataEmployees(employees)) {
      return true
    }
  }
  else if (uploadPath === './static/novedadesupdate.csv' || uploadPath === './static/novedadesfired.csv') {
    console.log("revisando arvhivo de update o fired")
    for (let i = 0; i < employees.length; i++) {
      if (isEmpty(employees[i])) {
        console.log("dato vacio")
        return true
      }
      if (isNotValidName(employees[i].nombres)) {
        console.log("error en el nombre de: ", employees[i].nombres)
  
        return true
      }
      if (isNotValidName(employees[i].apellidos)) {
        console.log("error en el apellido de: ", employees[i].nombres)
  
        return true
      }
      if (isNotNumber(employees[i].tipoidentificacion)) {
        console.log("error en el tipo de identificacion de: ", employees[i].nombres)
  
        return true;
      }
      if (isNotNumber(employees[i].numeroidentificacion)) {
        console.log("error en el numero de identificacion de: ", employees[i].nombres)
  
        return true;
      }
      if (isNotNumber(employees[i].numerocelular)) {
        console.log("error en el celular de: ", employees[i].nombres)
        return true;
      }
      if (uploadPath === './static/novedadesupdate.csv') {
        if (isNaN(employees[i].salario)) {
          console.log("error en el salario de: ", employees[i].nombres)
          return true;
        }
      }
    }
  }
  return false
}
// ################## fin utils functions ########################


const registerNovelties = async (req, res) => {
  const {
    nit,
    nitLegalRepresentative,
    nameLegalRepresentative,
    lastLegalRepresentative,
    checkNotContinue,
  } = req.body;

  const enterpriseData = await EnterpriseProgram.findOne({
    where: { NIT: nit },
  });

  if (enterpriseData) {
    enterpriseData.NIT_LEGAL_REPRESENTATIVE = nitLegalRepresentative;
    enterpriseData.NAME_LEGAL_REPRESENTATIVE = nameLegalRepresentative;
    enterpriseData.LAST_NAME_LEGAL_REPRESENTATIVE = lastLegalRepresentative;
    enterpriseData.save();
    
    if (!checkNotContinue) {
      await Account.update({ PAYROLL_ADVANCE: false }, {where:{SUBPRODUCT: nit}})
      const allEmployeesEnterprise = await Customer.findAndCountAll({
        where: { NAME_ENTERPRISE: enterpriseData.NAME },
      });
      allEmployeesEnterprise.rows.forEach(async (employee) => {
        employee.NAME_ENTERPRISE = '';
        employee.IDENTIFICATION_ENTERPRISE = '';
        employee.save();
        const customerOperationDataEmployee = await CustomerOperation.findOne({
          where: { CUSTOMER_ID: employee.CUSTOMER_ID },
        });
        if (customerOperationDataEmployee) {
          await Account.update(
            { PAYROLL_ADVANCE: false },
            {
              where: {
                PRODUCT: employee.IDENTIFICATION_NUMBER,
                SUBPRODUCT: customerOperationDataEmployee.SUBPRODUCT,
              },
            }
          );
        }
      });
      res.json({ feedBack: ['Retiro del programa exitoso'] });
    } else {
      res.json({
        feedBack: ['Datos de representante legal actualizados'],
      });
    }
  } else {
    res.json({ feedBack: ['Nit incorrecto'] });
  }
};

const fileRegister = async (req) => {
  let errors = [];
  const fileId = Math.floor(Math.random() * 100000);
  const { nit } = req.body;
  console.log(nit);
  try {
    const enterpriseData = await EnterpriseProgram.findOne({
      where: {
        NIT: nit,
      },
    });
    if (enterpriseData) {
      let uploadPath;
      const dataAccepted = [
        'nombres',
        'apellidos',
        'tipoidentificacion',
        'numeroidentificacion',
        'fechaexpedicion',
        'lugarexpedicion',
        'correo',
        'numerocelular',
        'politicamenteexpuesta',
        'salario',
      ];
      console.log(enterpriseData);
      if (!req.files || Object.keys(req.files).length === 0) {
        return { feedBack: ['falta el archivo'] };
      }

      novedadesRegister = req.files.novedadesregistro;
      uploadPath = './static/' + novedadesRegister.name;

      if (!novedadesRegister) {
        return;
      }

      novedadesRegister = req.files.novedadesregistro;
      uploadPath = './static/' + novedadesRegister.name;

      if (!novedadesRegister) {
        return;
      }

      await novedadesRegister.mv(uploadPath, (err) => {
        if (err) {
          console.log(err);
        }
        const employees = csvToJson.getJsonFromCsv(uploadPath);
        if (employees.length === 0) {
          return { error: 'Archivo vacio' };
        }

        Object.keys(employees[0]).forEach((key) => {
          if (!dataAccepted.includes(key)) {
            errors.push(key);
          }
        });
        if (errors.length > 0) {
          return { error: errors };
        } else {
          registerInFilesSentTable(
            enterpriseData.NAME,
            nit,
            'novelties new employees',
            fileId,
            employees.length
          );
          isDaviplataAlreadyCreated(employees, enterpriseData.NAME, nit).then(
            (users) => {
              if (users.usersDontExisting.length > 0) {
                // sendEmail(users, employees, email);
                for (let i = 0; i < users.usersDontExisting.length; i++) {
                  altaCliente(
                    users.usersDontExisting[i].numeroidentificacion,
                    users.usersDontExisting[i].nombres.split(' ')[0],
                    users.usersDontExisting[i].nombres.split(' ')[1],
                    users.usersDontExisting[i].apellidos.split(' ')[0],
                    users.usersDontExisting[i].apellidos.split(' ')[1],
                    users.usersDontExisting[i].numerocelular,
                    users.usersDontExisting[i].correo,
                    users.usersDontExisting[i].lugarexpedicion,
                    enterpriseData.NAME,
                    nit,
                    users.usersDontExisting[i].salario
                  ).then((userCreated) => {
                    registerInFilesDetails(
                      users.usersDontExisting[i].numeroidentificacion,
                      fileId,
                      'novelties new employees',
                      'ok'
                    );
                    if (userCreated) {
                      console.log('usuario creado');
                    }
                  });
                }
                return { users };
              } else {
                return { message: 'succesfull' };
              }
            }
          );
        }
      });
    } else {
      return { error: 'nit incorrecto' };
    }
  } catch (error) {
    return { error: 'Nit incorrecto' };
  }
};

const fileFired = async (req) => {
  let errors = [];
  const fileId = Math.floor(Math.random() * 100000);
  const { nit } = req.body;
  try {
    const enterpriseData = await EnterpriseProgram.findOne({
      where: { NIT: nit },
    });
    if (enterpriseData) {
      let uploadPath;
      const dataAccepted = [
        'nombres',
        'apellidos',
        'tipoidentificacion',
        'numeroidentificacion',
        'numerocelular',
      ];

      if (!req.files || Object.keys(req.files).length === 0) {
        return { feedBack: ['falta el archivo'] };
      }

      novedadesFired = req.files.novedadesfired;
      uploadPath = './static/' + novedadesFired.name;

      if (!novedadesFired) {
        return;
      }

      await novedadesFired.mv(uploadPath, (err) => {
        if (err) {
          console.log(err);
        }
        const employees = csvToJson.getJsonFromCsv(uploadPath);
        if (employees.length === 0) {
          return { error: 'Archivo vacio' };
        }

        Object.keys(employees[0]).forEach((key) => {
          if (!dataAccepted.includes(key)) {
            errors.push(key);
          }
        });
        if (errors.length > 0) {
          return { error: errors };
        } else {
          registerInFilesSentTable(
            enterpriseData.NAME,
            nit,
            'novelties fired',
            fileId,
            employees.length
          );
          try {
            employees.forEach(async (employee) => {
              await Account.update(
                { PAYROLL_ADVANCE: false },
                {
                  where: {
                    PRODUCT: employee.numeroidentificacion,
                    SUBPRODUCT: employee.numerocelular,
                  },
                }
              );
              await Customer.update(
                { NAME_ENTERPRISE: '', 
                  IDENTIFICATION_ENTERPRISE: '' 
                },
                {
                  where: {
                    IDENTIFICATION_NUMBER: employee.numeroidentificacion,
                  },
                }
              );
              registerInFilesDetails(
                employee.numeroidentificacion,
                fileId,
                'novelties fired',
                'ok'
              );
            });
            return { message: 'succesfull' };
          } catch (error) {
            return { error };
          }
        }
      });
    } else {
      return { error: 'nit incorrecto' };
    }
  } catch (error) {
    return { error: 'Nit' };
  }
};

const fileUpdate = async (req) => {
  let errors = [];
  const fileId = Math.floor(Math.random() * 100000);
  const { nit } = req.body;

  try {
    const enterpriseData = await EnterpriseProgram.findOne({
      where: { Nit: nit },
    });
    if (enterpriseData) {
      let uploadPath;
      const dataAccepted = [
        'nombres',
        'apellidos',
        'tipoidentificacion',
        'numeroidentificacion',
        'numerocelular',
        'salario',
      ];

      if (!req.files || Object.keys(req.files).length === 0) {
        return { feedBack: ['falta el archivo'] };
      }

      novedadesUpdate = req.files.novedadesupdate;
      uploadPath = './static/' + novedadesUpdate.name;

      if (!novedadesUpdate) {
        return;
      }

      await novedadesUpdate.mv(uploadPath, (err) => {
        if (err) {
          console.log(err);
        }
        const employees = csvToJson.getJsonFromCsv(uploadPath);
        if (employees.length === 0) {
          return { error: 'Archivo vacio' };
        }

        Object.keys(employees[0]).forEach((key) => {
          if (!dataAccepted.includes(key)) {
            errors.push(key);
          }
        });
        if (errors.length > 0) {
          return { feedBack: [`Campo incorrecto ${key}`] };
        } else {
          registerInFilesSentTable(
            enterpriseData.NAME,
            nit,
            'novelties update',
            fileId,
            employees.length
          );
          try {
            employees.forEach(async (employee) => {
              await Customer.update(
                { SALARY: employee.salario },
                {
                  where: {
                    IDENTIFICATION_NUMBER: employee.numeroidentificacion,
                  },
                }
              );
              registerInFilesDetails(
                employee.numeroidentificacion,
                fileId,
                'novelties update',
                'ok'
              );
            });
            return { message: 'succesfull' };
          } catch (error) {
            return { error };
          }
        }
      });
    } else {
      return { error: 'nit incorrecto' };
    }
  } catch (error) {
    return { error: 'Nit incorrecto' };
  }
};

const readNoveltiesFile = async (req, res) => {
  let errors = [];
  const fileAccepted = ['register', 'fired', 'update'];
  Object.values(req.query).forEach((typeFile) => {
    if (!fileAccepted.includes(typeFile)) {
      errors.push(typeFile);
    }
  });
  if (errors.length > 0) {
    return res.json({ error: errors });
  }

  if (req.query.type === 'register') {
    fileRegister(req).then((response) => {
      return res.json(response);
    });
  } else if (req.query.type === 'fired') {
    fileFired(req).then((response) => {
      return res.json(response);
    });
  } else if (req.query.type === 'update') {
    fileUpdate(req).then((response) => {
      return res.json(response);
    });
  }
};

const validateNoveltiesFile = async (req, res) => {
  const { companyNit } = req.body

  const companyData = await EnterpriseProgram.findOne({
    where: {
      NIT: companyNit
    }
  })
  console.log("nit de la compañia: ", companyNit)
  let uploadPath;
  let errors = [];
  const fileAccepted = [
    'novedadesupdate',
    'novedadesfired',
    'novedadesregistro',
  ];
  const dataAccepted = [
    'nombres',
    'apellidos',
    'tipoidentificacion',
    'numeroidentificacion',
    'fechaexpedicion',
    'lugarexpedicion',
    'correo',
    'numerocelular',
    'politicamenteexpuesta',
    'salario',
  ];

  if (!req.files || Object.keys(req.files).length === 0) {
    return res.json({ feedBack: ['falta el archivo'] });
  }

  let novedades = new Object();
  Object.keys(req.files).forEach((nameFile) => {
    if (fileAccepted.includes(nameFile)) {
      if (
        nameFile === 'novedadesupdate' &&
        req.files.novedadesupdate.name === 'novedadesupdate.csv'
      ) {
        novedades = req.files.novedadesupdate;
        console.log(novedades.name);
      } else if (
        nameFile === 'novedadesfired' &&
        req.files.novedadesfired.name === 'novedadesfired.csv'
      ) {
        novedades = req.files.novedadesfired;
        console.log(novedades.name);
      } else if (
        nameFile === 'novedadesregistro' &&
        req.files.novedadesregistro.name === 'novedadesregistro.csv'
      ) {
        novedades = req.files.novedadesregistro;
        console.log(novedades.name);
      } else {
        return res.json({
          feedBack: ['Nombre o extension de archivo incorrecto'],
        });
      }
    }
  });
  if (novedades.name) {
    uploadPath = './static/' + novedades.name;
    console.log(uploadPath);

    if (!novedades) {
      return;
    }

    await novedades.mv(uploadPath, async (err) => {
 
      const employees = csvToJson.getJsonFromCsv(uploadPath);
      const wrongStructure = isWrongStructure(employees[0], dataAccepted)
      if(wrongStructure) {
        res.json(({feedBack: ["Estructura incorrecta"]}))
        return
      }
      
      const validateData = validateDataNovelties(employees, uploadPath)
      
      if (employees.length === 0) {
        res.json({ feedBack: ['Archivo Vacio'] });
        return;
      }
      if(validateData) {
        errors.push("Datos incorrectos")
      }
      if (novedades.name !== 'novedadesregistro.csv') {
        const userDataWrong = await checkUserDataIsCorrect(employees, companyData.NAME, companyNit)
        if (userDataWrong.length > 0) {
          errors.push("Datos incorrectos")
         } 
        const usersNotInTheCompany = await checkUsers(employees, companyData.NAME, companyNit)
        if (usersNotInTheCompany.length > 0) {
          errors.push("Datos incorrectos")
        } 
      }
      if (novedades.name === 'novedadesfired.csv') {
        const usersFired = await userIsalreadyFired(employees)
        if (usersFired.length > 0) {
          errors.push("Datos incorrectos")
        } 
      }
      Object.keys(employees[0]).forEach((key) => {
        if (!dataAccepted.includes(key)) {
          console.log('Datos no aceptados');
          errors.push(key);
        }
      });
      if (novedades.name === 'novedadesregistro.csv') {
        
        const usersinOther = await isDaviplataAlreadyCreated(employees, companyData.NAME, companyNit)
        if (usersinOther.userinAnotherCompany.length > 0) {
          errors.push("Datos incorrectos 5")
        }
      }
      
      if (errors.length > 0) {
        return res.json({ feedBack: [errors[0]] });
      } else {
        return res.json({
          feedBack: [
            'Verificación de archivo e información exitosa'
          ],
        });
      }
    });
  }
};

module.exports = {
  registerNovelties,
  validateNoveltiesFile,
  readNoveltiesFile,
};
