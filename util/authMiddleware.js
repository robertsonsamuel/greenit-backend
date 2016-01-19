'use strict';

const jwt    = require('jwt-simple')
    , moment = require('moment')
    , CONFIG = require('./authConfig')
    , User   = require('../models/user');

module.exports = function(req, res, next) {

              console.log("in Auth Route");
              req.cookies.token = "delete me later";
              next();


  console.log(" GOT A COOKIE ", req.cookies.token, req.cookies);
  var token = req.cookies.token;
  if (!token) {
    return res.status(401).send('authorization required');
  }

  try {
    var decoded = jwt.decode(token, process.env.JWT_SECRET);
  } catch (e) {
    return res.status(401).send('authorization required');
  }

  if (decoded.exp < moment().unix()) {
    return res.status(401).send('authorization expired');
  }

  if (CONFIG.refreshToken) {
    User.findOneById(decoded.id, (err, user) => {
      if (err) return res.status(400).send('server error');
      if (!user) return res.status(401).send('authorization required');
      req.userId = decoded.id;
      res.cookie('token', user.token())
      next();
    });
  } else {
    req.userId = decoded.id;
    next();
  }
};
