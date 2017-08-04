var express = require('express');
var path = require('path');
var mongodb = require('mongodb').MongoClient;
var http = require('http');

var app = express();
var errorMsg = "";

var config = require('./config');
console.log(process.env.DB);
var url = config.DB;

// Static HTML page if no param sent to server
app.use(express.static(path.join(__dirname, 'public')));

// Avoid wrong data in Mongo due to browser Favicon lookup as URL Param
app.get('/favicon.ico', function(req, res) {
    res.status(204);
});

// handle get with Params
app.get('/:url*', function (req,res,next) {

	// console.log(parseInt(req.params['url']));
	
	// if urlParam is a 4-digit Number user is forwarded to the given website
	if(isNaN(req.params['url']) == false && req.params['url'].toString().length === 4) {
		
		// console.log("forward to website");
		
		mongodb.connect(url, function( err, db ){

			var collection2 = db.collection('urlsRandomNumbers');

			// consle.log(req.params['url']);

			collection2.find({
				randomNbr: parseInt(req.params['url'])
			}).toArray(function(err, results){

				
				if(results.length === 0) {
    				
    				// console.log("no entrance found");
    				errorMsg = "No entry " + parseInt(req.params['url']) + " found in Database."
					res.send({error: errorMsg});
					db.close();

  				} else {
    				
    				// console.log(results[0].url);
    				res.writeHead(302, {
					  'Location': results[0].url
					});
					res.end();
					db.close();
    			}
				
			});
		});

	} else {
		
		// console.log("unvalid shortcut");


		var urlParam = req.params['url']+req.params[0]

		// console.log(isUrl(urlParam));
		
		// check if URL has valid format
		if(isUrl(urlParam) === true) {


			mongodb.connect(url, function( err, db ){
				
				if(err) throw err;

				// generating random number
				var randomNbr = generateRandomumber();
				// console.log(randomNbr);
				// console.log(urlParam);
				var doc = {};

				var collection = db.collection('urlsRandomNumbers');

				// avoid double insertation of URL into MongoDB
				collection.find({
					url: urlParam
				}).toArray(function(err, results){
					if(results.length === 0) {
	    				// console.log("kein Eintrag"); // output all records
	    				var doc = {
							url: urlParam,
							randomNbr : randomNbr 
						}
						collection.insert(doc, function(err, data) {
							if (err) throw err;
						//	console.log(JSON.stringify(doc));
							db.close();
						})

						res.send({ 'original_url': urlParam, 'shortLink' : 'http://localhost:3000/' +randomNbr });

					} else {
	    				
	    				// console.log(results); // output all records
	    				res.send({ 'original_url': results[0].url, 'shortLink' : 'http://localhost:3000/' + results[0].randomNbr });
					}
					
				});
			});
		} else {
		
			res.send({error: "URL is not valid"})
		} 
	
	}
	
});

app.listen(3000);



function generateRandomumber() {
	var val = Math.floor(1000 + Math.random() * 9000);
	return val;
}

function isUrl(s) {
   var regexp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/
   return regexp.test(s);
}