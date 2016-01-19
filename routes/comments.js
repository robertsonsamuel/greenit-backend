'use strict';

const express = require('express')
    , Comment   = require('../models/comment')
    , authMiddleware = require('../util/auth-middleware');

let router = express.Router();

router.get('/', (req, res) => {
  Comment.find({}, (err, comments) => {
    res.status( err ? 400 : 200).send(err || comments)
  });
});

router.post('/:root/:parent?', authMiddleware, (req, res) => {
  Comment.createNewComment(req.body, req.params, req.userId, (err, comment) => {
    res.status( err ? 400 : 200).send(err || comment)
  });
});

module.exports = router;
