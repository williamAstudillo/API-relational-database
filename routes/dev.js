const { Router } = require('express')

const { createAccountEnterprise, insertInrestrictiveList } = require('../controllers/dev')

const router = Router()

router.post('/createEnterpriseAccount', createAccountEnterprise)
router.post('/restrictive', insertInrestrictiveList)


module.exports = router

