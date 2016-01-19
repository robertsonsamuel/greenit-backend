'use strict';

const express = require('express')
    , Topic   = require('../models/topic')

let router = express.Router();

router.get('/', (req, res) => {
  Topic.find({}, (err, topics) => {
    res.status( err ? 400 : 200).send(err || topics)
  });
});

router.post('/', (req, res) => {
  Topic.create(req.body, (err, topics) => {
    res.status( err ? 400 : 200).send(err || topics)
  });
});

module.exports = router;
