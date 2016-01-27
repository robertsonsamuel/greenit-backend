'use strict';

const mongoose = require('mongoose')
    , User     = require('./user');

// VALID CATEGORIES
const VALID_CATEGORIES = new Set(['general', 'javascript', 'ruby', 'html', 'css', 'python', 'go', 'swift']);

let Resource;

let resourceSchema = mongoose.Schema({
  title: { type: String, required: true },
  link: { type: String, required: true},
  body: { type: String, default: "" },
  category: { type: String, default: "general" },
  user: { type: mongoose.Schema.Types.ObjectId , ref: 'User', required: true },
  timestamp: { type : Date, default: Date.now }
});


resourceSchema.statics.createNewResource = (newResource, userId, cb) => {
  newResource.category = newResource.category.replace(/\W/g, '').toLowerCase();
  newResource.user = userId;
  Resource.create(newResource, (err, savedResource) => {
    return err ? cb(err) : cb(null, savedResource);
  });
};

// VALIDATORS
resourceSchema.path('user').validate(function (value, respond) {
  User.findById({_id: value}, function (err, foundUser) {
    respond( !err && !!foundUser );
  });
}, 'Error validating resource user');

resourceSchema.path('category').validate(function (value, respond) {
  respond( VALID_CATEGORIES.has(value) );
}, 'Error validating resource category');

Resource = mongoose.model('Resource', resourceSchema);
module.exports = Resource;
