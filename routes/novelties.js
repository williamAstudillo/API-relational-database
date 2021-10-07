const { Router } = require('express')
const { validateNoveltiesFile, registerNovelties, readNoveltiesFile } = require('../controllers/novelties')

const router = Router()

router.post('/', registerNovelties)
router.post('/validateFile', validateNoveltiesFile)
router.post('/file', readNoveltiesFile)

module.exports = router