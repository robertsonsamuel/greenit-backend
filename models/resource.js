'use strict';

const mongoose = require('mongoose')
    , User     = require('./user');


let Resource;

let resourceSchema = mongoose.Schema({
  title: { type: String, required: true },
  body: { type: String, default: "" },
  user: { type: mongoose.Schema.Types.ObjectId , ref: 'User' },
  timestamp: { type : Date, default: Date.now }
});

resourceSchema.statics.createNewResource = (newResource, userId, cb) => {
  newResource.user = userId;
  Resource.create(newResource, (err, savedResource) => {
    return err ? cb(err) : cb(null, savedResource);
  });
};

// VALIDATORS
resourceSchema.path('user').validate(function (value, respond) {
  User.findById({_id: value}, function (err, foundUser) {
    if (err || !foundUser) {
      respond(false);
    } else {
      respond(true);
    }
  });
}, 'Error validating user');

Resource = mongoose.model('Resource', resourceSchema);
module.exports = Resource;
