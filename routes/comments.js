'use strict';

const express = require('express')
    , Comment   = require('../models/comment')
    , User   = require('../models/user')
    , authMiddleware = require('../util/auth-middleware');

let router = express.Router();

router.get('/:root', (req, res) => {
  Comment.find({'root' : req.params.root })
  .sort({'timestamp': -1})
  .populate('user').exec((err, comments) => {
    User.greenit(req);
    res.status( err ? 400 : 200).send(err || Comment.treeify(comments));
  });
});

router.post('/:parent', authMiddleware, (req, res) => {
  Comment.createNewComment(req, (err, newComment) => {
    res.status( err ? 400 : 200).send(err || newComment);
  });
});

router.put('/:commentId', authMiddleware, (req, res) => {
  Comment.editComment(req, (err, editedComment) => {
    res.status( err ? 400 : 200).send(err || editedComment);
  })
});

router.delete('/:commentId', authMiddleware, (req, res) => {
  Comment.deleteComment(req, (err, success) => {
    res.status( err ? 400 : 200).send(err || success);
  })
});

module.exports = router;
