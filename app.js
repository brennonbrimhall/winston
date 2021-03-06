var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var busboy = require('express-busboy');
var notifier = require('mail-notifier');
var auth = require('./auth.json');

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

//Initialize Busboy for file uploads
busboy.extend(app, {
	upload: true,
	path: path.join(__dirname, 'uploads')
});

//Turn on mail-notifier
var imap = {
	user: auth.user,
	password: auth.pass,
	host: 'imap.gmail.com',
	port: 993,
	tls: true,
	tlsOptions: {rejectUnauthorized: false}
};

//n represents our imap connection
var n = notifier(imap);
n.on('end', function(){
	n.start();
}).on('mail', function(mail){
	console.log('Mail recieved from '+mail.from[0].name);
	//This is the magic that will take texts and then download them.
	
	//Verify that this is a Text Message coming in as an email.  We
	//will do that by seeing if the first three characters in the
	//subject line reads "SMS"

	var mailer = require('./helpers/mailer.js');

	if(mail.subject.substring(0, 3) === 'SMS'){
		//Then we're good!

		var getIPCommands = [
			"ip ",
			"ip?"
		];

		var ipCommand = false;

		for(var i = 0; i < getIPCommands.length; i++){
			if(mail.text.toLowerCase().includes(getIPCommands[i])){
				ipCommand = true;
			}
		}

		if(ipCommand){
			console.log('Giving public IP address to '+mail.from[0].name);
			var ipify = require('ipify');
			ipify((err, ip) => {
				console.log('    - ' + ip);
				mailer.mail(mail.from[0].address, '', 'I live at '+ip+' currently.  Love, Winston');
			});
		}else{

			//If it is Monday, accept the text:
			if((new Date()).getDay() === 1){
				var phoneNumber = mail.from[0].name;
				
				//Formatting the string to match up with iMOS:
				//First, removing the space and adding a dash
				phoneNumber = phoneNumber.replace(' ', '-');
				
				//Now, removing parenthesees:
				phoneNumber = phoneNumber.replace('(', '');
				phoneNumber = phoneNumber.replace(')', '');
				
				//Now, adding a +1:
				phoneNumber = '+1 '+phoneNumber;
				//Finished!

				//Now, parsing their numbers
				var text = mail.text;
				var report = {};
				text = text.split('\n'); //Splitting into array based off of newline

				console.log(text);
				
				text.forEach(function(currentValue, index, array){
					if(currentValue.split(':').length == 2){
						//If we have a line with no semicolons or too many, ignore.
						var indicator = currentValue.split(':')[0].toLowerCase();
						var value = parseInt(currentValue.split(':')[1]);
						report[indicator] = value;
					}else{
						console.log('Too little/many semicolons')
					}
				});

				//Validate that we got all the indicators we wanted
				var dynamicRequire = require('./helpers/dynamicRequire.js');
				console.log('Required dynamicRequire:'+dynamicRequire);
				var reportConfig = dynamicRequire.read('../weeklyreports/config.json');

				//Add in miles (it's special and so we don't want it in config)
				reportConfig.push({
					"name": "Miles",
					"shortname": "miles"
				});
				var valid = true;
				var indicatorsMissing=[];

				console.dir(report);

				reportConfig.forEach(function(currentValue, index, array){
					//Do we have a numerical value for each of the indicators in the config?
					if(typeof report[currentValue.shortname] === 'undefined' || isNaN(report[currentValue.shortname])){
						valid = false;
						indicatorsMissing.push(currentValue.shortname);
						console.log('Report invalid');
					}
				});

				//If valid, save and say that it was successfully inputted.
				//If not, reply that there was a problem.
				if(valid){
					//Save file
					var today = new Date();

					var numbers;
					try{
						//Get the file that holds all of this week's numbers reports
						numbers = dynamicRequire.readWeeklyReport(today);
						console.log('Was able to load up previous report file.');
					}catch(err){
						//Init empty array.  We will create this file.
						console.log(err);
						numbers = [];
					}

					//Adding it to the numbers reports

					//Do we have a record already from them today?  If so, we need to overwrite it.
					var needToOverwrite = false;
					var overwriteIndex;

					console.log(numbers);

					numbers.forEach(function(currentValue, index, array){
						if(currentValue.phone == phoneNumber){
							needToOverwrite = true;
							overwriteIndex = index;
						}
					});

					if(needToOverwrite){
						//Overwriting.
						numbers[overwriteIndex] = {recieved: Date.now(), phone: phoneNumber, report: report};
						console.log('Overwriting')
					}else{
						//No need to overwrite, appending.
						numbers.push({recieved: Date.now(), phone: phoneNumber, report: report});
						console.log('Saving')
					}

					dynamicRequire.writeWeeklyReport(today, numbers);

					if(needToOverwrite){
						mailer.mail(mail.from[0].address, '', 'Thank you for submitting your numbers report again.  I was able to successfully process it and overwrite your previous report.  Be sure to submit your report again through the missionary portal.  Love, Winston');
						console.log('Sent acknowledgement text for overwrite');
					}else{
						if((new Date).getHours() > 9){
							mailer.mail(mail.from[0].address, '', 'My dear missionary, you are LATE with your report -- you must submit it after the mission prayer and before 9:15!  I did, however, process your report.  Be sure to submit your report again through the missionary portal.  Love, Winston');	
							console.log('Sent acknowledgement text');
						}else if ((new Date).getHours() < 9){
							mailer.mail(mail.from[0].address, '', 'My dear missionary, you are EARLY with your report -- you must submit it after the mission prayer and before 9:15!  I did, however, process your report.  Be sure to submit your report again through the missionary portal.  Love, Winston');	
							console.log('Sent acknowledgement text');
						}else{
							mailer.mail(mail.from[0].address, '', 'Thank you for your numbers report.  Be sure to submit your report again through the missionary portal.  Love, Winston');	
							console.log('Sent acknowledgement text');
						}
					}

				}else{
					//Reply that there was a problem.
					mailer.mail(mail.from[0].address, '', 'Hmmm...it seems we\'re missing the following indicators: '+JSON.stringify(indicatorsMissing)+'.  Can you try sending your report again?  Love, Winston');
				}

			}else{
				//It's not Monday, so we need to reject the text.
				console.log('Report recieved, even though it\'s not Monday.');
				mailer.mail(mail.from[0].address, '', 'Perhaps we have a misunderstanding...it\'s not Monday.  If you really do need to send this in now, please contact the Assistants at 303-929-1845.  Love, Winston');
			}
		}

		//Get what phone texted at us, along with their message.

	}else{
		//Not a valid numbers report, not coming from a text
		//message.  We will mail the sender a message saying
		//that this is an automated email account and that
		//it didn't understand what it was saying.
		
		mailer.mail(mail.from[0].address, 'Automated Reply to Your Message', 
			'This email account does not accept reply messages.  If you are getting emails from this account and would like them to stop, please call (720)-675-7146.\n\nLove,\nWinston.', 
			function(err, info){
			if(err){
				console.log('Error while replying to non-text email: '+err);
			}else{
				console.log('Replied to non-text email.');
			}
		});
	}
}).on('error', function(){
	console.log('I am having a problem connecting to Gmail to see if I have any reports to process.  I\'m going to wait a minute and attempting to reestablish, but you may need to restart me.');
	setTimeout(function(){
		n.start();	
	}, 60000);
	
}).start();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);
app.use('/', require('./routes/buds.js'));
app.use('/', require('./routes/import.js'));
app.use('/', require('./routes/numbers.js'));
app.use('/', require('./routes/buds.js'));
app.use('/', require('./routes/reports.js'));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
	app.use(function(err, req, res, next) {
		res.status(err.status || 500);
		res.render('error', {
			message: err.message,
			error: err
		});
	});
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
	res.status(err.status || 500);
	res.render('error', {
		message: err.message,
		error: err
	});
});


module.exports = app;