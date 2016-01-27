'use strict';

const express = require('express')
    , Resource   = require('../models/resource')
    , authMiddleware = require('../util/auth-middleware');

let router = express.Router();

router.get('/:category', (req, res) => {

  let filter = (req.params.category === 'all') ? {} : { category:  req.params.category};
  filter.timestamp = { $ne: null };

  Resource.find(filter)
  .sort({'timestamp': -1})
  .lean()
  .populate({ path: 'user', select: 'username _id'}).exec((err, resources) => {
    res.status( err ? 400 : 200).send(err || Resource.condition(resources))
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
  });
})

router.put('/:resourceId', authMiddleware, (req, res) => {
  Resource.editResource(req, (err, editedResource) => {
    res.status( err ? 400 : 200).send(err || editedResource);
  });
});

router.delete('/:resourceId', authMiddleware, (req, res) => {
  Resource.deleteResource(req, (err, success) => {
    res.status( err ? 400 : 200).send(err || success);
  });
});

module.exports = router;
