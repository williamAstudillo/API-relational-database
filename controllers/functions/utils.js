/**
 * checks if is a number or not
 * @param {string} number 
 * @returns return true if NOT a number or false in opposite case
 */
const isNotNumber = (number) => {
    const numberPattern = /^[0-9]*$/
    console.log(number)
    if (number.match(numberPattern)) {
        return false
    }
    return true
}

/**
 * verifica que sea un correo
 * @param {string} email 
 * @returns true si NO es un email, false si es un email
 */
const isNotEmail = (email) => {
  const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;

    if (email.match(emailPattern)) {
        return false;
    }
    else {
        return true
    }
}

/**
 * 
 * @param {string} name 
 * @returns true if NOT is a valid name or false in opposite case
 */
const isNotValidName = (name) => {
    const onlyLettersandSpaces =  /^[a-zA-Z\s]*$/
    if(name.match(onlyLettersandSpaces)) {
        return false
    }
    else {
        return true
    }
}

/**
 * checks if a value of an object is empty or not
 * @param {Object} object 
 * @returns true if a value of an Object is empty, false if not
 */
const isEmpty = (object) => {
    const dataArray = Object.values(object)
    for (let index = 0; index < dataArray.length; index++) {
        if (!dataArray[index] || dataArray[index].length === 0) {
            return true
        }
    }
    return false
}

/**
 * Verifica que la cabecera del archivo sea correcta
 * @param {Object} data 
 * @param {array} acceptedData
 * @returns true si la cabecera es incorrecta, false si es correcta
 */
const isWrongStructure = (data, acceptedData) => {
    const dataKeys = Object.keys(data)
    for (let i = 0; i < dataKeys.length; i++) {
        if(!acceptedData.includes(dataKeys[i])) {
            return true
        }        
    }
    return false
}

/**
 * Checkea que los datos del archivos sean correctos
 * @param {array} employees
 * @returns true si los datos son incorrectos, false en caso de que todo este bien
 */
 const validateDataEmployees = (employees) => {
    for (let index = 0; index < employees.length; index++) {
      if (isEmpty(employees[index])) {
        console.log("error longuitud de campos de: ", employees[index].nombres)
  
        return true
      }
      if (isNotValidName(employees[index].nombres)) {
        console.log("error en el nombre de: ", employees[index].nombres)
  
        return true
      }
      if (isNotValidName(employees[index].apellidos)) {
        console.log("error en el apellido de: ", employees[index].nombres)
  
        return true
      }
      if (isNotNumber(employees[index].tipoidentificacion)) {
        console.log("error en el tipo de identificacion de: ", employees[index].nombres)
  
        return true;
      }
      if (isNotNumber(employees[index].numeroidentificacion)) {
        console.log("error en el numero de identificacion de: ", employees[index].nombres)
  
        return true;
      }
      if (isNotNumber(employees[index].lugarexpedicion)) {
        console.log("error en el lugar de expedicion de: ", employees[index].nombres)
  
        return true;
      }
      if (isNotEmail(employees[index].correo)) {
        console.log("error en el celcorreo de: ", employees[index].nombres)
  
        return true
      }
      if (isNotNumber(employees[index].numerocelular)) {
        console.log("error en el celular de: ", employees[index].nombres)
        return true;
      }
      if (employees[index].politicamenteexpuesta !== 'si' && employees[index].politicamenteexpuesta !== 'no') {
        console.log("error en el politica de: ", employees[index].nombres)
  
        return true
      }
      if (isNaN(employees[index].salario)) {
        console.log("error en el salario de: ", employees[index].nombres)
  
        return true;
      }
      
    }
    return false
  };
module.exports = {isNotEmail, isNotValidName, isEmpty, isNotNumber, isWrongStructure, validateDataEmployees}