'use strict';

const express = require('express')
    , Resource   = require('../models/resource')
    , authMiddleware = require('../util/auth-middleware');

let router = express.Router();

router.get('/', (req, res) => {
  Resource.find({})
  .sort({'timestamp': -1})
  .populate('user').exec((err, resources) => {
    res.status( err ? 400 : 200).send(err || resources)
  });
});

router.post('/', authMiddleware, (req, res) => {
  Resource.createNewResource(req.body, req.userId, (err, resource) => {
    res.status( err ? 400 : 200).send(err || resource);
  });
});

module.exports = router;
