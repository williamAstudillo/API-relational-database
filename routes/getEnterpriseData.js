const { Router } = require('express');
const {
  getEnterpriseData,
} = require('../controllers/getEnterpriseData');

const router = Router();

router.get('/:nit', getEnterpriseData);

module.exports = router;
