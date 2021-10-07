const { Router } = require('express')
const { payments, validateFile, deposits } = require('../controllers/payments');

const router = Router()

router.post('/', payments)
router.post('/validateFile', validateFile);
router.post('/deposits',deposits)

module.exports = router