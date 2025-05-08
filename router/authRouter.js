var express = require('express');
var router = express.Router();

const authService = require('../controller/auditController');

router.get('/login', auditController.callingPlatform);

module.exports = router;
