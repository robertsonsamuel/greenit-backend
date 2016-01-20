'use strict';

const express = require('express')
    , Topic   = require('../models/topic')
    , authMiddleware = require('../util/auth-middleware');

let router = express.Router();

router.get('/', (req, res) => {
  Topic.find({})
  .sort({'timestamp': -1})
  .populate('user').exec((err, topics) => {
    res.status( err ? 400 : 200).send(err || topics)
  });
});

router.post('/', authMiddleware, (req, res) => {
  Topic.createNewTopic(req.body, req.userId, (err, topic) => {
    res.status( err ? 400 : 200).send(err || topic);
  });
});

module.exports = router;
