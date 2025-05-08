var express = require('express');
var router = express.Router();

const auth = require('./authRouter'); // Auth Route
const clinic = require('./clinics');
router.use('/auth', audit);
router.use('/clinic', clinic);

module.exports = router;