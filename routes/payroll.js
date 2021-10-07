const { Router } = require('express')
const {newPayroll} = require('../controllers/payroll')

const router = Router()

router.post('/new', newPayroll)

module.exports = router