const { Router } = require('express');
const {getDataEmployees, getDataEmploy} = require('../controllers/getDataEmployees');

const router = Router();

router.get('/', getDataEmployees);
router.get('/employ', getDataEmploy)

module.exports = router;
