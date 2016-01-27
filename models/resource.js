'use strict';

const NUM_TO_RETURN = 50;
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
  timestamp: { type : Date, default: Date.now },
  editTime: { type : Date, default: null },
  upvotes: { type: Number, default: 0 },
  downvotes: { type: Number, default: 0 }
});

resourceSchema.statics.createNewResource = (newResource, userId, cb) => {
  newResource.category = (newResource.category || '').replace(/\W/g, '').toLowerCase();
  if (!newResource.category) newResource.category = "general";
  newResource.user = userId;
  Resource.create(newResource, (err, savedResource) => {
    return err ? cb(err) : cb(null, savedResource);
  });
};


resourceSchema.statics.editResource = (req, cb) => {

  let resourceUpdate = req.body
    , updateId       = req.params.resourceId
    , userId         = req.userId;

  let errMsg = "error updating resource";
  Resource.findOne({ _id: updateId, user: userId, timestamp: { $ne: null } }, (err, foundResource) => {
    if (err || !foundResource) return cb(err || errMsg);
    foundResource.body = req.body.body;
    foundResource.editTime = Date.now();
    foundResource.save( err => {
      if (err) return cb(err);
      return cb(null, foundResource);
    })
  })
};

resourceSchema.statics.deleteResource = (req, cb) => {

  let updateId = req.params.resourceId
    , userId   = req.userId;

  let errMsg = "error deleteing resource";
  Resource.findOne({ _id: updateId, user: userId, timestamp: { $ne: null } }, (err, foundResource) => {
    if (err || !foundResource) return cb(err || errMsg);
    foundResource.title = '[deleted]';
    foundResource.link = '[deleted]';
    foundResource.body = '[deleted]';
    foundResource.editTime = null;
    foundResource.timestamp = null;
    foundResource.save( err => {
      if (err) return cb(err);
      return cb(null, foundResource);
    })
  })
};


resourceSchema.statics.condition = (resources) => {
  return resources
    .map((resource) => {
      // you can adjust the score calculation here however you want
      resource.score = resource.upvotes - resource.downvotes;
      return resource;
    })
    .sort((resourceA, resourceB) => {
      return resourceB.score - resourceA.score;
    })
    .slice(0, NUM_TO_RETURN);
}



resourceSchema.statics.vote = (req, cb) => {

  let findResource = new Promise((resolve, reject) => {
    Resource.findById(req.params.resourceId, (err, resource) => {
      if (err || !resource) return reject(err || "no resource found");
      resolve(resource);
    });
  });

  let findUser = new Promise((resolve, reject) => {
    User.findById(req.userId, (err, user) => {
      if (err || !user) return reject(err || "no user found");
      resolve(user);
    });
  });

  Promise.all([findResource, findUser]).then( applyVote, (err) => {
    cb(err);
  });

  function applyVote(resourceAndUserArr) {
    let foundResource = resourceAndUserArr[0];
    let foundUser = resourceAndUserArr[1];
    let vote = req.body.vote


    let upIndex = foundUser.upvotes.indexOf(foundResource._id);
    if (upIndex === -1) upIndex = Infinity;
    let downIndex = foundUser.downvotes.indexOf(foundResource._id);
    if (downIndex === -1) downIndex = Infinity;

    let downInc = 0;
    let upInc = 0;

    if (vote === 'up'){
      if (upIndex === Infinity) {
        // the user has no upvote for this resource
        upInc++;
        foundUser.upvotes.push(foundResource._id);
        downInc -= foundUser.downvotes.splice(downIndex, 1).length;
      } else {
        // the user has an upvote for this resource;
        upInc--;
        foundUser.upvotes.splice(upIndex,1);
      }
    } else if (vote ==='down') {
      if (downIndex === Infinity) {
        // the user has no downvote for this resource
        downInc++;
        foundUser.downvotes.push(foundResource._id);
        upInc -= foundUser.upvotes.splice(upIndex, 1).length;
      } else {
        // the user has a downvote for this resource;
        downInc--;
        foundUser.downvotes.splice(downIndex,1);
      }
    } else {
      return cb("invalid vote");
    }

    let saveUser = new Promise( (resolve, reject) => {
      foundUser.save( (err, savedUser) => {
        if (err) return reject(err);
        resolve(savedUser);
      })
    })

    let updateResource = new Promise( (resolve, reject) => {
      let increments =  { $inc: { upvotes: upInc, downvotes: downInc } };
      Resource.findByIdAndUpdate(foundResource._id, increments, (err, updatedResource) => {
        if (err) return reject(err);
        resolve(updatedResource);
      })
    })

    Promise.all([updateResource, saveUser]).then( (resourceAndUserArr) => {
      return cb(null, resourceAndUserArr[1]);
    }, (err) => {
      return cb(err);
    })

  }
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
