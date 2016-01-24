'use strict';

const mongoose = require('mongoose')
    , User     = require('./user');


let Topic;

let topicSchema = mongoose.Schema({
  title: { type: String, required: true },
  body: { type: String, default: "" },
  user: { type: mongoose.Schema.Types.ObjectId , ref: 'User' },
  timestamp: { type : Date, default: Date.now }
});

topicSchema.statics.createNewTopic = (newTopic, userId, cb) => {
  newTopic.user = userId;
  Topic.create(newTopic, (err, savedTopic) => {
    return err ? cb(err) : cb(null, savedTopic);
  });
};

// VALIDATORS
topicSchema.path('user').validate(function (value, respond) {
  User.findById({_id: value}, function (err, foundUser) {
    if (err || !foundUser) {
      respond(false);
    } else {
      respond(true);
    }
  });
}, 'Error validating user');

Topic = mongoose.model('Topic', topicSchema);
module.exports = Topic;
