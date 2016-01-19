'use strict';

const mongoose = require('mongoose')
    , Topic    = require('./topic')
    , User     = require('./user');

let Comment;

let commentSchema = mongoose.Schema({
  body: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId , ref: 'User', required: true },
  root: { type: mongoose.Schema.Types.ObjectId , ref: 'Topic', required: true },
  parent: { type: mongoose.Schema.Types.ObjectId , ref: 'Comment' },
  timestamp: { type : Date, default: Date.now, required: true },
  editTime: { type : Date, default: null }
});

commentSchema.statics.createNewComment = (newComment, params, userId, cb) => {
  if (newComment.user !== userId) return cb("authorization error");
  newComment.root = params.root;
  if (params.parent) newComment.parent = params.parent;
  Comment.create(newComment, (err, savedComment) => {
    return err ? cb(err) : cb(null, savedComment);
  });
};


// VALIDATORS
var errMsg = "Error posting commment";
commentSchema.path('user').validate(function (value, respond) {
  User.findById({_id: value}, function (err, foundUser) {
    if (err || !foundUser) {
      respond(false);
    } else {
      respond(true);
    }
  });
}, 'Error validating user');

commentSchema.path('root').validate(function (value, respond) {
  Topic.findById({_id: value}, function (err, foundTopic) {
    if (err || !foundTopic) {
      respond(false);
    } else {
      respond(true);
    }
  });
}, 'Error validating root');

commentSchema.path('parent').validate(function (value, respond) {
  Comment.findById({_id: value}, function (err, foundComment) {
    if (err || !foundComment) {
      respond(false);
    } else {
      respond(true);
    }
  });
}, 'Error validating parent comment');

Comment = mongoose.model('Comment', commentSchema);
module.exports = Comment;
