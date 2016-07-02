var express = require('express');
var router = express.Router();
var xlsx = require('xlsx');
var fs = require('fs');

/* GET home page. */
router.get('/', function(req, res, next) {
	var dynamicRequire = require('../helpers/dynamicRequire.js');

	var os = require('os');

	var interfaces = os.networkInterfaces();
	var addresses = [];
	for (var k in interfaces) {
		for (var k2 in interfaces[k]) {
			var address = interfaces[k][k2];
			if (address.family === 'IPv4' && !address.internal) {
				addresses.push(address.address);
			}
		}
	}

	console.dir(addresses);

	var format = dynamicRequire.read('../weeklyreports/config.json');
	res.render('index', { title: 'Winston', format: format, addresses: addresses});
});

router.get('/miles', function(req, res, next){
	var dynamicRequire = require('../helpers/dynamicRequire.js');
	var datetime = require('../helpers/datetime.js');

	//When was the last day of the previous month?
	var d = new Date();
	d.setDate(1);
	d.setHours(-1);

	//Now, give it to datetime to get the previous Monday.
	var lastMonday = datetime.getLastMondayFromDate(d);
	var lastLastMonday = datetime.getLastMondayFromDate(d);
	lastLastMonday.setHours(-7*24);
	console.log(lastMonday.toDateString());
	console.log(lastLastMonday.toDateString());

	var data = [];

	//Get areas, then get the associated ending miles
	var areas = dynamicRequire.readAreas();
	var weeklyReport = dynamicRequire.readWeeklyReport(lastMonday);
	var previousWeeklyReport = dynamicRequire.readWeeklyReport(lastLastMonday);
	
	var i = 0;
	
	for(group in areas){
		for(zone in areas){
			if(zone != "MISSION OFFICE"){
				for (district in areas[group][zone]){
					for (area in areas[group][zone][district]){
						data[i] = {};
						data[i].area = areas[group][zone][district][area];
						data[i].zoneName = zone;
						data[i].districtName = district;
						data[i].areaName = area;
						data[i].endingOdometer = 0;
						data[i].estimated = 0;

						//Getting ending miles from report
						for(var j = 0; j < weeklyReport.length; j++){
							if(areas[group][zone][district][area].phone == weeklyReport[j].phone){
								data[i].endingOdometer = weeklyReport[j].report.miles;
							}
						}

						//Getting ending miles from previous report to caculate weekly usage,
						//then using that to estimate the monthly ending odometer.
						var weeksToInterpolate = (d.getDate() - lastMonday.getDate())/7;

						for(var j = 0; j < previousWeeklyReport.length; j++){
							if(areas[group][zone][district][area].phone == previousWeeklyReport[j].phone){
								data[i].estimated = data[i].endingOdometer + weeksToInterpolate*(data[i].endingOdometer - previousWeeklyReport[j].report.miles);
							}
						}

						i++;
					}
				}
			}
		}
	}

	console.dir(data);

	res.render('miles', {title: 'Month End Miles', data: data, reportedDate: lastMonday});
});

router.get('/sendtext', function(req, res, next){
	var dynamicRequire = require('../helpers/dynamicRequire.js');

	//If a message is not defined, that means that we did not request
	//a text.
	if(typeof req.query.message === 'undefined'){
		//No data to send
		if(req.query.success == 'true'){
			res.render('text', {title: 'Text the Mission', alert: {type: 'success', title: 'Mass Text Sent!', body: 'Your text message was successfully queued to be delivered.'}});
		}else if(req.query.success == 'false'){
			res.render('text', {title: 'Text the Mission', alert: {type: 'danger', title: 'Mass Text Failed!', body: 'I\'m sorry, but an error occurred while trying to send your text.'}});
		}else{
			res.render('text', {title: 'Text the Mission'});
		}
	}else{
		//Now that we've made sure that we need to send a text, let's
		//send it.
		
		//Let's make an array of all the phones, plus @txt.att.net
		var phones = [];
		var areas = dynamicRequire.readAreas();
		for(group in areas){
			for(zone in areas[group]){
				//Cutting out mission office
				if(zone != 'MISSION OFFICE'){
					for(district in areas[group][zone]){
						for(area in areas[group][zone][district]){
							phones.push(areas[group][zone][district][area].phone);
						}
					}
				}
			}
		}


		console.dir(phones);

		//Now, initiating emails.
		var mailer = require('../helpers/mailer.js');

		mailer.massText(phones, '', req.query.message, function(err, info){
			if(err){
				console.log(err);
				res.redirect('/sendtext?success=false');
			}else{
				res.redirect('/sendtext?success=true');
			}
		});
	}
});

module.exports = router;
