'use strict';

const Resource = require('../models/resource')
    , Comment     = require('../models/comment');

module.exports = {

  fullResource: (resourceId, cb) => {
    console.log("finding resource", resourceId);
    let findResource = new Promise((resolve, reject) => {
      Resource.findById(resourceId)
        .populate({ path: 'user', select: 'username _id'})
        .exec((err, resource) => {
          if (err || !resource) return reject(err || "no resource found");
          console.log("got resource", resource);
          resolve(resource);
        });
    });

    let findComments = new Promise((resolve, reject) => {
      Comment.find({'root' : resourceId })
        .sort({'timestamp': -1})
        .lean()
        .populate({ path: 'user', select: 'username _id'}).exec((err, comments) => {
          if (err) return reject(err);
          console.log("got comments", comments);
          resolve( Comment.treeify(comments) );
        });
    });

    Promise.all([findComments, findResource])
      .then((commentsAndResource) => {
        console.log("promise all worked", commentsAndResource);
        let resp = {
          comments: commentsAndResource[0],
          resource: commentsAndResource[1]
        }
        cb(null, resp)
      }, (err) => {
        console.log("there was an error", err);
        cb(err);
      })
  }

}
