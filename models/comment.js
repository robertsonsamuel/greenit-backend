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
  timestamp: { type : Date, default: Date.now},
  editTime: { type : Date, default: null }
});

commentSchema.statics.createNewComment = (req, cb) => {

  var newComment = req.body
    , seed     = req.query.seed
    , params     = req.params
    , userId     = req.userId;

  newComment.user = req.userId;

  if (seed==="true") {
    newComment.root = params.parent;
    Comment.create(newComment, (err, savedComment) => {
      return err ? cb(err) : cb(null, savedComment);
    })
  } else {
    Comment.findById(params.parent, (err, parentComment) => {
      if (err || !parentComment) return cb(err || "error creating comment");
      newComment.root = parentComment.root;
      newComment.parent = parentComment._id;
      Comment.create(newComment, (err, savedComment) => {
        return err ? cb(err) : cb(null, savedComment);
      });
    })
  }

};

commentSchema.statics.editComment = (req, cb) => {

  var commentUpdate = req.body
    , updateId     = req.params.commentId
    , userId        = req.userId;

  var errMsg = "error updating comment";
  Comment.findById(updateId, (err, foundComment) => {
    if (foundComment.timestamp === null) return cb("Comment has been deleted");
    if (err || !foundComment) return cb(err || errMsg);
    if (foundComment.user != userId) return cb(errMsg);
    foundComment.body = req.body.body;
    foundComment.editTime = Date.now();
    foundComment.save( err => {
      if (err) return cb(err);
      return cb(null, foundComment);
    })
  })
};

commentSchema.statics.deleteComment = (req, cb) => {

  var updateId = req.params.commentId
    , userId   = req.userId;

  var errMsg = "error deleteing comment";
  Comment.findById(updateId, (err, foundComment) => {
    if (err || !foundComment) return cb(err || errMsg);
    if (foundComment.user != userId) return cb(errMsg);
    if (foundComment.timestamp === null) return cb("Comment already deleted")
    foundComment.body = '[deleted]';
    foundComment.editTime = null;
    foundComment.timestamp = null;
    foundComment.save( err => {
      if (err) return cb(err);
      return cb(null, foundComment);
    })
  })
};

commentSchema.statics.treeify = (comments) => {

  let childrenDictionary = comments.reduce((childrenDictionary, comment) => {
    comment = comment.toObject();
    let parent = comment.parent || 'root';
    if (childrenDictionary[parent]) {
      childrenDictionary[parent].push(comment);
    } else {
      childrenDictionary[parent] = [comment];
    }
    return childrenDictionary;
  }, {});

  function populatePost(post) {
    if (!childrenDictionary[post]) return [];
    // can sort childrenDictionary[post] here
    return childrenDictionary[post].map(child => {
      child.children = populatePost(child._id);
      return child;
    })
  }

  return populatePost('root');
};


// VALIDATORS
let errMsg = "Error posting commment";
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
