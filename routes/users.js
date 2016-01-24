'use strict';

const express = require('express')
    , User    = require('../models/user')
    , authMiddleware = require('../util/auth-middleware');

let router = express.Router();

router.post('/register', (req, res) => {
  User.register(req.body, (err, token) => {
    res.status(err ? 400 : 200).send(err || token);
  });
});

router.post('/login', (req, res) => {
  User.login(req.body, (err, token) => {
    res.status(err ? 400 : 200).send(err || token);
  });
});

router.post('/forgot', (req, res) => {
  User.recovery(req, (err, message) => {
    if(err) console.log(err);
    if(message) console.log(message);
    res.status(err ? 400 : 200).send(err || message)
  })
});

router.post('/reset/:token', (req, res) => {
  User.reset(req, (err) => {
    res.status(err ? 400 : 200).send(err || 'Reset Successful!')
  })
})

router.get('/:userId', authMiddleware, (req, res) => {
  if (req.params.userId !== req.userId) return res.status(403).send("unauthorized");
  User.findById(req.params.userId)
  .select('+greenTopics')
  .exec((err, user) => {
    res.status(err ? 400 : 200).send(err || user);
  })
})



module.exports = router;
