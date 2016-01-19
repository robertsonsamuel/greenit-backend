'use strict';

const express = require('express')
    , Comment   = require('../models/comment')

let router = express.Router();

router.get('/', (req, res) => {
  Comment.find({}, (err, comments) => {
    res.status( err ? 400 : 200).send(err || comments)
  });
});

router.post('/', (req, res) => {
  Comment.create(req.body, (err, comment) => {
    res.status( err ? 400 : 200).send(err || comment)
  });
});

module.exports = router;
