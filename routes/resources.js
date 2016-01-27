'use strict';

const express = require('express')
    , Resource   = require('../models/resource')
    , authMiddleware = require('../util/auth-middleware');

let router = express.Router();

router.get('/:category', (req, res) => {
  console.log("category", req.params.category);
  let filter = (req.params.category === 'all') ? {} : { category:  req.params.category};
  Resource.find(filter)
  .sort({'timestamp': -1})
  .populate({ path: 'user', select: 'username _id'}).exec((err, resources) => {
    res.status( err ? 400 : 200).send(err || resources)
  });
});

router.post('/', authMiddleware, (req, res) => {
  Resource.createNewResource(req.body, req.userId, (err, resource) => {
    res.status( err ? 400 : 200).send(err || resource);
  });
});

router.post('/vote/:resourceId', authMiddleware, (req, res) => {
  Resource.vote(req, (err, savedUser) => {
    res.status( err ? 400 : 200).send(err || savedUser);
  })
})

module.exports = router;
