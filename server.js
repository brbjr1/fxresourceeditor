/*global process */
var fs = require('fs')
var http = require('http');
var https = require('https');
var express = require('express');
var jsforceAjaxProxy = require('./proxy');
var path = require('path');

var options = {
    
    maxAge: -1
};

if (1 == 2)
{
	options.key = fs.readFileSync('./ca.key');
    options.cert =  fs.readFileSync('./ca.crt');
}

var app = express();

app.configure(function () {
  app.set('port', process.env.PORT || 80);
});

app.configure('development', function () 
{
  app.use(express.errorHandler());
});

app.all('/proxy/?*', jsforceAjaxProxy({ enableCORS: true }));

/*
app.get('/', function(req, res) {
  //res.send('JSforce AJAX Proxy');
  	//res.send('index.html');
  	res.redirect('index.html');
});
*/

app.use(express.static('./http_docs/'));


http.createServer(app).listen(app.get('port'), function () {
  console.log("Express server listening on port " + app.get('port'));
});

/*
var server = https.createServer(options, app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
*/
