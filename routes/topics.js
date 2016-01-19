'use strict';

const express = require('express')
    , Topic   = require('../models/topic')
    // , User    = require('../models/user')

let router = express.Router();

router.get('/', (req, res) => {
  Topic.find({}, (err, topics) => {
    res.status( err ? 400 : 200).send(err || topics)
  });
});

module.exports = router;
