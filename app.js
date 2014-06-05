'use strict';

// libs
var request = require('request');
var argv    = require('minimist')(process.argv.slice(2));
var jquery  = require('jquery');
var jsdom   = require('jsdom').jsdom;
var fs      = require('fs');
var jsdiff  = require('diff');
var makeapi = require('makeapi-client')({
	apiURL: 'https://makeapi.webmaker.org'
});

// some debug magic
function debug() {
	if( argv.debug ) {
		return console.log.apply( null, arguments );
	}
	return;
}

// some output magic
function output( data ) {
	if( argv.output ) {
		fs.writeFileSync( argv.output, JSON.stringify( data ) );
		return;
	}

	console.log( data );
}

// stores
var allMakes = [];
var originalMake = {};
var stats = {
	participants: 0,
	remixes: 0,
	remixComplexity: {
		min: 0,
		max: 0,
		avg: 0
	},
	locales: {
		length: 0
	},
	tags: {
		length: 0
	}
};

// options
var options = {
	tags: [ 'supportopen' ]
};


if( argv.tags ) {
	options.tags = argv.tags.split( ',' );
}

// functions
function getOriginalMake( done, make ) {
	make = make || allMakes[0];
	make.original( function( error, makes ) {
		if( error ) {
			return console.error( error );
		}

		if ( makes ) {
			debug( '%s is not the original make, hunting', allMakes[0].title );
			getOriginalMake( done, makes[0] );
			return;
		}

		request.get( make.url + '_', function( error, response, body ) {
			if( !error && response.statusCode === 200 ) {
				debug( 'got the original make' );
				make.html = body;
				originalMake = make;

				allMakes = [ make ].concat( allMakes );

				if( done ) {
					done( make );
				}
			}
		});
	});
}

function getTestimonial( make, done ) {
	request.get( make.url + '_', function( error, response, body ){
		if( !error && response.statusCode === 200 ) {
			debug( 'getting testimonial for %s', make.url );

			make.html = body;

			body = body.replace(/<script(.*?)>(.*?)<\/script>/, '', 'ig');

			var doc	     = jsdom( body );
			var window   = doc.parentWindow;
			var document = window.document;

			try {
				var $ = jquery.create( window );

				if( $( 'blockquote > p:first-child' ).text() !== '' ) {
					make.testimonial = $( 'blockquote > p:first-child' ).text().trim();
				}
			}
			catch (e) {
				// do nothing on fail just ignore it.
			}

			done( make.testimonial );
		}
	});
}

function getPercentageDifference( remixedMake, done ) {
	var diff = jsdiff.diffLines( originalMake.html, remixedMake.html );

	var pctDiff = ( diff.length / originalMake.html.length ) * 100;

	debug( '%s is %s% different to the original', remixedMake.title, pctDiff );

	remixedMake.percentageDifferent = pctDiff;

	done( pctDiff );
}

// used to get all makes matching tag (no matter how many there be)
function nextAPICall( page, done ) {
	debug( 'getting page %s from makeapi', page );
	makeapi
		.getRemixCounts()
		.tags( options.tags )
		.limit( 100 )
		.sortByField( 'createdAt' )
		.page( page )
		.then( function( error, makes ){
			if( error ) {
				return console.error( error );
			}

			if( makes.length === 0 ) {
				debug( 'all makes found' );
				return doneAPICalls( done );
			}

			allMakes = allMakes.concat( makes );

			nextAPICall( page + 1, done );
		});
}

function doneAPICalls( done ) {
	debug( 'all api calls done' );
	// get all testimonials
	var processes = 0;
	function processDone() {
		processes = processes -1;

		if( processes === 0 ) {
			doneTestimonials( done );
		}
	}

	allMakes.forEach( function( make ) {
		processes++;

		getTestimonial( make, processDone );
	});
}

function doneTestimonials( done ) {
	debug( 'all testimonials fetched' );

	getOriginalMake( function() {
		var processes = 0;
		function processDone() {
			processes = processes -1;

			if( processes === 0 ) {
				done( done );
			}
		}

		processes = allMakes.length;
		allMakes.forEach( function( make, idx ) {
			getPercentageDifference( make, processDone );
		});
	});
}

nextAPICall( 1, function() {
	debug( 'done all the getting of things, now mathing' );
	// now we have all the bits of information we need/want. Generate some numbers

	// help get unique users
	var users = [];

	// help get tags
	var tags = [];

	// help get locales
	var locales = [];

	// help get average remix complexity
	var pctDiff = [];
	var avgPctTmp = 0;

	allMakes.forEach( function( make, idx ) {
		if( users.indexOf( make.username ) === -1 ) {
			users.push( make.username );
			stats.participants++;
		}

		pctDiff.push( make.percentageDifferent );
		avgPctTmp += make.percentageDifferent;

		make.tags.forEach( function( tag ) {
			tag = tag.toLowerCase();

			if( /^tutorial-/.test( tag ) ) {
				return; // dont want to count tutorials
			}

			if( tags.indexOf( tag ) === -1 ) {
				tags.push( tag );
				stats.tags.length++;
				stats.tags[ tag ] = 0;
			}

			stats.tags[ tag ]++;
		});

		if( locales.indexOf( make.locale ) === -1 ) {
			locales.push( make.locale );
			stats.locales.length++;
			stats.locales[ make.locale ] = 0;
		}

		stats.locales[ make.locale ]++;
	});

	// get remix complexity
	stats.remixComplexity.min = Math.min.apply( null, pctDiff );
	stats.remixComplexity.max = Math.max.apply( null, pctDiff );
	stats.remixComplexity.avg = avgPctTmp / pctDiff.length;

	// total remixes
	stats.remixes = allMakes.length - 1; // one less than total (original make in there somewhere)



	// output
	if( argv.data ) {
		output( allMakes );
		return;
	}
	output( stats );
});
