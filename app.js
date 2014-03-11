var request = require('request'),
	jquery  = require('jquery'),
	jsdom   = require('jsdom').jsdom,
	fs      = require('fs'),
	moment  = require('moment'),
	makeapi = require('makeapi-client')({
		apiURL: "https://makeapi.webmaker.org"
	});

var startTime = moment().unix();

var getResponse = function(make){
	request.get(make.url + '_', function(error, response, body){
		if(!error && response.statusCode === 200){
			body = body.replace(/<script(.*?)>(.*?)<\/script>/, '', 'ig');

			var doc	     = jsdom(body),
				window   = doc.parentWindow,
				document = window.document,
				$        = jquery.create(window);

			if($('blockquote > p:first-child').text() !== ''){
				fs.appendFile('responses-' + startTime, make.username + ': ' + $('blockquote > p:first-child').text().trim() + '\n');
			}
		}
	});
};

makeapi
	.tags({
		tags: ['supportopen']
	})
	.sortByField('updatedAt', 'desc')
	.limit(100)
	.then(function(err, makes){
		// check if search failed...
		if(err){
			// let users know we failed, but devs know why
			console.log('Error', err);
			return;
		}

		// add each make to the display
		makes.forEach(function(make){
			if(make.contentType == "application/x-thimble"){
				getResponse(make);
			}
		});
	});
