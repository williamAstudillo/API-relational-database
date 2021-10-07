const csvToJson = require('convert-csv-to-json')

const csvReader = (file) => {
    return csvToJson.getJsonFromCsv(file)
}

module.exports = csvReader
