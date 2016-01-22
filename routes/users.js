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

router.get('/:userId', authMiddleware, (req, res) => {
  if (req.params.userId !== req.userId) return res.status(403).send("unauthorized");
  User.findById(req.params.userId, (err, user) => {
    res.status(err ? 400 : 200).send(err || user);
  })
})

module.exports = router;
