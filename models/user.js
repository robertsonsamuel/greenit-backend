'use strict';

const mongoose = require('mongoose')
    , jwt      = require('jwt-simple')
    , bcrypt   = require('bcryptjs')
    , moment   = require('moment')
    , CONFIG   = require('../util/auth-config');

let User;

let userSchema = mongoose.Schema({
  username: {type: String, required: true, unique: true},
  password: {type: String, required: true, select: false},
  greenTopics: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Topic' }] , select: false, default: [] }
});

userSchema.methods.token = function() {
  let payload = {
    id: this._id,
    iat: moment().unix(),
    exp: moment().add(CONFIG.expTime.num, CONFIG.expTime.unit).unix(),
    username: this.username,
  };
  return jwt.encode(payload, process.env.JWT_SECRET);
};

userSchema.statics.greenit = function(req) {
  //extract id from req header
  if (!req.headers.authorization) return;
  let token = req.headers.authorization.replace('Bearer ', '');
  try {
    var decoded = jwt.decode(token, process.env.JWT_SECRET);
  } catch (e) {
    return;
  }
  if (decoded.exp < moment().unix()) return;

  // find user and add topic to green list
  User.findById(decoded.id).select('+greenTopics').exec((err, user) => {
    if (err || !user) return;
    if (user.greenTopics.some( id => req.params.root == id)) return;
    user.greenTopics.push(req.params.root);
    user.save((err) => {
      console.log("error greening topic", user._id, req.params.root);
      return;
    });
  })

}

userSchema.statics.login = function(userInfo, cb) {
  // look for user in database
  User.findOne({username: userInfo.username}).select('+password').exec((err, foundUser) => {
    if (err) return cb('server error');
    if (!foundUser) return cb('incorrect username or password');
    bcrypt.compare(userInfo.password, foundUser.password, (err, isGood) => {
      if (err) return cb('server err');
      if (isGood) {
        var token = foundUser.token()
        foundUser = foundUser.toObject();
        delete foundUser.password;
        console.log("returning saved user", foundUser);
        return cb(err, token );
      } else {
        return cb('incorrect username or password');
      }
    });
  });
}

userSchema.statics.register = function(userInfo, cb) {
  let username  = userInfo.username
    , password  = userInfo.password
    , password2 = userInfo.password2;

  // compare passwords
  if (password !== password2) {
    return cb("passwords don't match");
  }

  // validate password
  if (!CONFIG.validatePassword(password)) {
    return cb('invalid password');
  }

  // validate username
  if (!CONFIG.validateUsername(username)) {
    return cb('invalid username');
  }

  // create user model
  User.findOne({username: username}, (err, user) => {
    if (err) return cb('error registering username');
    if (user) return cb('username taken');
    bcrypt.genSalt(CONFIG.saltRounds, (err, salt) => {
      if (err) return cb(err);
      bcrypt.hash(password, salt, (err, hashedPassword) => {
        if (err) return cb(err);
        let newUser = new User({
          username: username,
          password: hashedPassword
        });
        newUser.save((err, savedUser) => {
          var token = savedUser.token()
          savedUser = savedUser.toObject();
          delete savedUser.password;
          console.log("returning saved user", savedUser);
          return cb(err, token );
        })
      });
    });
  });
};

User = mongoose.model('User', userSchema);
module.exports = User;
