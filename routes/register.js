const {Router} = require('express')
const {
  createUser,
  registerInProgram,
  validateFile,
  readFile,
} = require('../controllers/register');

const router = Router()

router.post('/file', readFile)
router.post('/create/user', createUser)
// router.post('/create/enterprise', createEnterprise)
router.post('/', registerInProgram)
router.post('/validateFile', validateFile);

module.exports = router