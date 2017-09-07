var express = require('express');
var cors = require('cors');
app = express();
port = process.env.PORT || 3000;



mongoose = require('mongoose');
senseMap = require('./api/models/sensemapModel'); 
bodyParser = require('body-parser');
  
mongoose.Promise = global.Promise;
//mongoose.connect('mongodb://localhost/sensemapDb'); 
mongoose.connect('mongodb://shahzaib:sVgpQm4SejTdhz9f@ds157682.mlab.com:57682/smapdb'); 

app.use(function(req, res, next) {
  var allowedOrigins = ['http://127.0.0.1:8020', 'http://localhost:8020', 'http://localhost:3000', 'http://localhost:9000'];
  var origin = req.headers.origin;
  if(allowedOrigins.indexOf(origin) > -1){
       res.setHeader('Access-Control-Allow-Origin', origin);
  }
  //res.header('Access-Control-Allow-Origin', 'http://127.0.0.1:8020');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', true);
  return next();
});

app.use(cors());
app.options('*', cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
var routes = require('./api/routes/sensemapRoutes'); 
routes(app);

app.listen(port);
console.log('senseMap RESTful API server started on: ' + port);