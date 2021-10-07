const {Router} = require('express')
const {logsLoans, logsPayments, dailyReport} = require('../controllers/logs')

const router = Router()

router.post('/loans', logsLoans)
router.post('/payments', logsPayments)
router.post('/dailyReport', dailyReport)


module.exports = router