'use strict';

const express = require('express')
    , Comment   = require('../models/comment')
    , authMiddleware = require('../util/auth-middleware');

let router = express.Router();

router.get('/:root', (req, res) => {
  Comment.find({'root' : req.params.root }, (err, comments) => {
    res.status( err ? 400 : 200).send(err || Comment.treeify(comments))
  });
});

router.post('/:root/:parent?', authMiddleware, (req, res) => {
  Comment.createNewComment(req.body, req.params, req.userId, (err, comment) => {
    res.status( err ? 400 : 200).send(err || comment)
  });
});

module.exports = router;
