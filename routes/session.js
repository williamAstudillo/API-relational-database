const { Router } = require('express')
const { login, signIn } = require('../controllers/session')

const router = Router()

router.post('/login', login)
router.post('/signin', signIn)

module.exports = router