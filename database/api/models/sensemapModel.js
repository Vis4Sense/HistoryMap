'use strict';

// Creating the Schemas
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

/* Session Tab Object */
var sessionSchema = new Schema({
  tabID:        { type: Number },
  url:          { type: String },
  title:        { type: String },
  favIconUrl:   { type: String },
  status:        { type: String },
});

/* Session Users Object */
var sensemapSchema = new Schema({
	
  displayName:  { type: String},
  name:         { type: String},
  tagline:      { type: String},
  aboutMe:      { type: String},
  emailAddress: { type: String},
  gender:       { type: String},
  occupation:   { type: String},
  pictureUrl:   { type: String},
  createdOn:    { type: Date, default: Date.now },
  activeSession: [sessionSchema]
  
});

module.exports = mongoose.model('SenseMap', sensemapSchema);

/*

For Testing:

{
"fullName":"Shahrukh Khan",
"emailAddress":"shahrukh@gmail.com",
"activeSession":[ {"tabID":1,"url":"http://google.com"}, {"tabID":1,"url":"http://google.com"} ],
"createdOn":"2017-08-16T15:49:30.325Z"
}

*/