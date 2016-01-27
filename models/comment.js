'use strict';

const mongoose = require('mongoose')
    , Resource = require('./resource')
    , User     = require('./user');

let Comment;

let commentSchema = mongoose.Schema({
  body: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId , ref: 'User', required: true },
  root: { type: mongoose.Schema.Types.ObjectId , ref: 'Resource', required: true },
  parent: { type: mongoose.Schema.Types.ObjectId , ref: 'Comment' },
  timestamp: { type : Date, default: Date.now},
  editTime: { type : Date, default: null },
  upvotes: { type: Number, default: 0 },
  downvotes: { type: Number, default: 0 }
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

    childrenDictionary[post].sort((commentA, commentB) => {
      let commentAscore = commentA.upvotes.length - commentA.downvotes.length;
      let commentBscore = commentB.upvotes.length - commentB.downvotes.length;
      return commentBscore - commentAscore;
    });

    return childrenDictionary[post].map(child => {
      child.children = populatePost(child._id);
      return child;
    })
  }

  return populatePost('root');
};

commentSchema.statics.vote = (req, cb) => {

  let findComment = new Promise((resolve, reject) => {
    Comment.findById(req.params.commentId, (err, comment) => {
      if (err || !comment) return reject(err || "no comment found");
      resolve(comment);
    });
  });

  let findUser = new Promise((resolve, reject) => {
    User.findById(req.userId, (err, user) => {
      if (err || !user) return reject(err || "no user found");
      resolve(user);
    });
  });

  Promise.all([findComment, findUser]).then( applyVote, (err) => {
    cb(err);
  });

  function applyVote(commentAndUserArr) {
    let foundComment = commentAndUserArr[0];
    let foundUser = commentAndUserArr[1];
    let vote = req.body.vote


    let upIndex = foundUser.upvotes.indexOf(foundComment._id);
    if (upIndex === -1) upIndex = Infinity;
    let downIndex = foundUser.downvotes.indexOf(foundComment._id);
    if (downIndex === -1) downIndex = Infinity;

    let downInc = 0;
    let upInc = 0;

    if (vote === 'up'){
      if (upIndex === Infinity) {
        // the user has no upvote for this comment
        upInc++;
        foundUser.upvotes.push(foundComment._id);
        downInc -= foundUser.downvotes.splice(downIndex, 1).length;
      } else {
        // the user has an upvote for this comment;
        upInc--;
        foundUser.upvotes.splice(upIndex,1);
      }
    } else if (vote ==='down') {
      if (downIndex === Infinity) {
        // the user has no downvote for this comment
        downInc++;
        foundUser.downvotes.push(foundComment._id);
        upInc -= foundUser.upvotes.splice(upIndex, 1).length;
      } else {
        // the user has a downvote for this comment;
        downInc--;
        foundUser.downvotes.splice(downIndex,1);
      }
    } else {
      return cb("invalid vote");
    }


    foundUser.save( (err, savedUser) => {
      if (err) return cb(err);
      let increments =  { $inc: { upvotes: upInc, downvotes: downInc } };
      Comment.findByIdAndUpdate(foundComment._id, increments, (err, updatedComment) => {
        if (err) return cb(err);
        return cb(null, savedUser);
      })
    })
  }
};

// VALIDATORS
let errMsg = "Error posting comment";
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
  Resource.findById({_id: value}, function (err, foundResource) {
    if (err || !foundResource) {
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
