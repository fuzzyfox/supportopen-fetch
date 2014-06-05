# Support Open Quilt Metrics

This small little app is a commandline tool to get some of those numbers you just
wish you had from your [Support Open Quilt](https://github.com/fuzzyfox/supportopen).

It does some stats generation for you, and makes it easier to get stats from
the data later on.

## Stats

Right now the app give you:

* Total number of remixes
* Number of locales
	* Number of remixes per locale
* Number of unique tags
	* Number of occurances of those tags
* Number of unique participants
* An indication of remix complexity using percentage difference
	* Minimum difference
	* Maximum difference
	* Average difference (mean)

## Raw Data

Not only does it give you the above number but it also gives you access to the
raw data ( + some additions needed to generate the numbers above ). This includes

* Make
	* Title
	* Author
	* Description
	* Remix Count
	* Thumbnail
	* URL
	* HTML
	* Percentage Difference
	* Testimonial (if it could be determined)
	* Locale
	* Created Time
	* Last Update
	* Tags
	* Remixed from (if it was a remix)

## App Usage

By default the app is runs silently searching for makes tagged "supportopen",
and spits into the console the JSON for the stats object, which looks a little
like this:

	// $ node app.js
	{
		participants: 73,
		remixes: 106,
		remixComplexity: {
			min: 0.002411672494875196,
			max: 0.03858675991800314,
			avg: 0.026866482372815293
		},
		locales: {
			length: 9,
			'': 72,
			fr: 5,
			'fr-FR': 1,
			en: 3,
			en_US: 21,
			es_CL: 1,
			'es-CL': 1,
			es: 2,
			th_TH: 1
		},
		tags: {
			length: 3,
			supportopen: 106,
			poetry: 1,
			teachtheweb: 2
		}
	}

### Searching for specific tags

Not every quilt is going to have makes tagged "supportopen" so there is a way to
change that when running the app.

	$ node app.js --tags=tags,are,comma,seperated

You can search for a specific combination of tags simply by comma seperating them.

### Getting the raw data

Easy!

	$ node app.js --raw

### Debug (tell me each step of the way what's going on)

	$ node app.js --debug

### Saving output to a file

You could sent STDOUT to a file, however then you can't use the debug feature,
instead you should utilize the following which will show debug information to the
console (if debug flag is set) and save results into a file.

	$ node app.js --output=outputFile.json

## Development

Make sure to have **grunt** installed globally.

	npm install -g grunt-cli

Next run `npm install`, followed by `grunt test` to run any/all tests.

#### Play nice

* remove trailing whitespace from files before save
* don't use non-ascii file names
* run `grunt test` before commit (and make sure there are no errors)

Do all this w/ ease!

	mv .git/hooks/pre-commit.sample .git/hooks/pre-commit
	echo "\n# run grunt build before commit, abort if errors\ngrunt test" >> .git/hooks/pre-commit

## License

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at <http://mozilla.org/MPL/2.0/>.
