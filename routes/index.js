'use strict';

const express = require('express')

let router = express.Router();

router.get('/forgotPassword', (req, res, next) => {
  res.render('forgotPassword')
})

module.exports = router;
