'use strict';

const mongoose = require('mongoose')
    , Topic    = require('./topic')
    , User    = require('./user');

let Comment;

let commentSchema = mongoose.Schema({
  body: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId , ref: 'User', required: true },
  root: { type: mongoose.Schema.Types.ObjectId , ref: 'Topic', required: true },
  parent: { type: mongoose.Schema.Types.ObjectId , ref: 'User', default: null },
  timestamp: { type : Date, default: Date.now, required: true },
  editTime: { type : Date, default: null }
});

commentSchema.statics.createNewComment = function(newComment, params, userId, cb) {
  if (newComment.user !== userId) cb("authorization error");

  var parent = params.parent;
  var errorMsg = "error posting comment";
  
  User.findById(userId, function(err, postingUser){
    if (err || !postingUser) return cb(err || errorMsg);
    if (params.isSeed) {
      Topic.findById(parent, function(err, parentTopic){
        if (err || !parentTopic) return cb(err || errorMsg);
        newComment.root = parentTopic._id;
        Comment.create(newComment, function(err, savedComment){
          return err ? cb(err) : cb(null, savedComment);
        })
      })
    }
    else {
      Comment.findById(parent, function(err, parentComment){
        if (err || !parentComment) return cb(err || errorMsg);
        newComment.parent = parentComment._id;
        newComment.root = parentComment.root;
        Comment.create({newComment}, function(err, savedComment){
          return err ? cb(err) : cb(null, savedComment);
        })
      })
    }
  })

};

Comment = mongoose.model('Comment', commentSchema);
module.exports = Comment;
