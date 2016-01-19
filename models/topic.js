'use strict';

const mongoose = require('mongoose')

let Topic;

let topicSchema = mongoose.Schema({
  title: { type: String, required: true },
  body: { type: String, default: " " },
  user: { type: mongoose.Schema.Types.ObjectId , ref: 'User' },
  timestamp: { type : Date, default: Date.now }
});

Topic = mongoose.model('Topic', topicSchema);
module.exports = Topic;
