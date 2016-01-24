'use strict';

const express = require('express')
    , User    = require('../models/user');

let router = express.Router();

router.get('/forgotPassword', (req, res, next) => {
  res.render('forgotPassword')
})

router.get('/resetPassword/:token', (req, res, next) => {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      return res.redirect('/forgotPassword');
    }
    res.render('resetPassword')
  });

})



module.exports = router;
