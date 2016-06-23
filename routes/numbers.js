var express = require('express');
var router = express.Router();

router.get('/numbers/keyindicators', function(req, res, next) {
	var dynamicRequire = require('../helpers/dynamicRequire.js');

	var config = dynamicRequire.read('../weeklyreports/config.json');
	res.render('key-indicators', {title: 'Manage Key Indicators', config: config});
});

router.get('/numbers/keyindicators/add', function(req, res, next) {
	var dynamicRequire = require('../helpers/dynamicRequire.js');
	var config = dynamicRequire.read('../weeklyreports/config.json');
	
	if(typeof req.query.name !== 'undefined' && typeof req.query.shortname !== 'undefined'){
		config.push({name: req.query.name, shortname: req.query.shortname, totallessons: false});
		dynamicRequire.writeWeeklyReportConfig(config);

		res.redirect('/numbers/keyindicators');
	}else{
		res.render('key-indicators-add', {title: 'Add Key Indicator'});
	}
});

router.get('/numbers/keyindicators/edit/:id', function(req, res, next) {
	var dynamicRequire = require('../helpers/dynamicRequire.js');
	var config = dynamicRequire.read('../weeklyreports/config.json');

	var id = req.params.id;

	if(typeof req.query.name !== 'undefined' && typeof req.query.shortname !== 'undefined'){
		config[id].name = req.query.name;
		config[id].shortname = req.query.shortname;

		dynamicRequire.writeWeeklyReportConfig(config);

		res.redirect('/numbers/keyindicators');
	}else{
		res.render('key-indicators-edit', {title: 'Edit Key Indicator', name: config[id].name, shortname: config[id].shortname, id: id});
	}
});

router.get('/numbers/keyindicators/delete/:id', function(req, res, next) {
	var dynamicRequire = require('../helpers/dynamicRequire.js');
	var config = dynamicRequire.read('../weeklyreports/config.json');

	var id = req.params.id;
	config.splice(id, 1);

	dynamicRequire.writeWeeklyReportConfig(config);

	res.redirect('/numbers/keyindicators');
});

router.get('/numbers/tocall', function(req, res, next) {
var dynamicRequire = require('../helpers/dynamicRequire.js');
var datetime = require('../helpers/datetime.js');

var areas = dynamicRequire.readAreas();

var lastMonday = datetime.getLastMonday();

//Get the phone numbres of those who HAVE submitted this week
var phoneNumbers = [];
var weeklyreports = dynamicRequire.readWeeklyReport(lastMonday);
for(report in weeklyreports){
	phoneNumbers.push(weeklyreports[report].phone);
}

//Now, going through the areas list and if they have NOT reported, we are going to put them
//into a new object that has a modified areas list with only those who have not reported.
var didNotReport = {};
for(group in areas){
	for(zone in areas){
		for(district in areas[group][zone]){
			for(area in areas[group][zone][district]){
				if(phoneNumbers.indexOf(areas[group][zone][district][area].phone) == -1){
					if(typeof didNotReport[zone] === 'undefined'){
						didNotReport[zone] = {};
					}
					if(typeof didNotReport[zone][district] === 'undefined'){
						didNotReport[zone][district] = {};
					}
					if(typeof didNotReport[zone][district][area] === 'undefined'){
						didNotReport[zone][district][area] = {};
					}
					didNotReport[zone][district][area] = areas[group][zone][district][area];
					console.dir(didNotReport[zone][district][area]);
				}
			}
		}
	}
}

res.render('tocall', {
	title: 'To Call',
	areas: didNotReport
})

});

router.get('/numbers/reports', function(req, res, next) {
var dynamicRequire = require('../helpers/dynamicRequire.js');

if(typeof req.query.phone !== 'undefined'){
	//Save this data that we got!
	var config = dynamicRequire.readWeeklyReportConfig();
	var report = {};

	//get phone, date, and miles
	var phoneNumber = req.query.phone;

	var date = new Date(req.query['$']);

	//For whatever reason, we get the day before the one we should.
	//Therefore, increment the day by one.
	date.setDate(date.getDate() + 1);

	var miles = req.query.miles;

	//now get everything else
	for(indicator in config){
		report[config[indicator].shortname] = req.query[config[indicator].shortname];
	}

	report.miles = miles;

	//Do we have a file for this reporting day?
	try{
		//Get the file that holds all of this week's numbers reports
		var numbers = dynamicRequire.readWeeklyReport(date);
	}catch(err){
		//Init empty array.  We will create this file.
		//console.log('Numbers file doesn\'t exist');
		var numbers = [];
	}

	//Adding it to the numbers reports

	//Do we have a record already from them today?  If so, we need to overwrite it.
	var needToOverwrite = false;
	var overwriteIndex;
	numbers.forEach(function(currentValue, index, array){
		if(currentValue.phone == phoneNumber){
			needToOverwrite = true;
			overwriteIndex = index;
		}
	});

	if(needToOverwrite){
		console.log('Overwriting.');
		numbers[overwriteIndex] = {recieved: Date.now(), phone: phoneNumber, report: report};
	}else{
		console.log('No need to overwrite, appending.');
		numbers.push({recieved: Date.now(), phone: phoneNumber, report: report});
	}

	console.log('Saving numbers...');

	dynamicRequire.writeWeeklyReport(date, numbers);

	//var fs = require('fs');
	//fs.writeFile('./weeklyreports/'+date.getUTCDate().toString()+'-'+(date.getMonth()+1).toString()+'-'+date.getFullYear().toString()+'.json', JSON.stringify(numbers), function(){

	var areas = dynamicRequire.readAreas();
	var phones = [];
	for(group in areas){
		for(zone in areas[group]){
			for(district in areas[group][zone]){
				for(area in areas[group][zone][district]){
					phones.push(areas[group][zone][district][area].phone);
				}
			}
		}
	}

	res.redirect('/reports?success=true');

}else{
	//No records to save
	var areas = dynamicRequire.readAreas();
	var config = dynamicRequire.readWeeklyReportConfig();
	var phones = [];

	for(group in areas){
		for(zone in areas){
			for(district in areas[group][zone]){
				for(area in areas[group][zone][district]){
					phones.push({name: area, 
						phone: areas[group][zone][district][area].phone});
				}
			}
		}
	}

	if(req.query.success == 'true'){
		res.render('reports', {phones: phones, config: config, alert: {type: 'success', title: 'Update successful!', body: 'Your numbers report was saved.'}});
	}else{
		res.render('reports', {phones: phones, config: config});
	}
}	
});

//Populate the areas with who is serving there
router.get('/numbers/areas', function(req, res, next) {
	var dynamicRequire = require('../helpers/dynamicRequire.js');
	var areas = dynamicRequire.readAreas();
	res.render('areas', {title: 'Areas', areas: areas});	
});

router.get('/areas/:area', function(req, res, next) {
	var dynamicRequire = require('../helpers/dynamicRequire.js');
	var areas = dynamicRequire.readAreas();
	var config = dynamicRequire.readWeeklyReportConfig();
	var data = [];
	var areaData = {};

	//First, we need to get the phone number for this area, which we will
	//do by correcting the area name, (since there can be a slash, we 
	//compensate by putting in a dash) and retrieving it from the directory 
	//of areas.
	var areaName = req.params.area.replace('-', '/');
	var phoneNumber;

	for(group in areas){
		for (zone in areas[group]) {
			for(district in areas[group][zone]){
				for(area in areas[group][zone][district]){
					if(area == areaName){
						phoneNumber = areas[group][zone][district][area].phone;
						areaData = areas[group][zone][district][area];
					}
				}
			}
		}
	}

	var datetime = require('../helpers/datetime.js');
	var week = datetime.getWeekOfTransfer();
	var lastMonday = datetime.getLastMonday();

	//If this is week 1, we need to get all of last transfer;
	//otherwise, just get this transfers'.
	var weeksBackToGet;
	if(week == 0){
		weeksBackToGet = 6;
	}else{
		weeksBackToGet = week;
	}

	//OK, now we want to open up the report for the last 6 transfers, if available.

	//Since this first transfer is special, do it manually.  Note how t = 0 in for loop
	//below
	data[0]=[];
	for(var i = 0; i < weeksBackToGet; i++){
		//This one should exist...
		var weeklyreport = dynamicRequire.readWeeklyReport(lastMonday);
		data[0][i] = {};

		//Only should be one report in there in a week...
		weeklyreport.forEach(function(currentValue, index, array){
			if(currentValue.phone == phoneNumber){
				data[0][i] = currentValue.report;
				//Get the date in there, $ won't ever be used as an indicator
				data[0][i]['$'] = lastMonday.getFullYear().toString()+'-'+(lastMonday.getMonth()+1).toString()+'-'+lastMonday.getDate().toString();
			}
		});
		//Clean up, now let's set the date to a week previous.
		lastMonday.setTime(lastMonday.getTime() - (7 * 24 * 60 * 60 * 1000));
	}	

	//Now to get the other weeks.
	/*for(var t = 1; t < 6; t++){
		for(var w = 0; w < 6; w++){
			//Now, we could theoretically bump back before Winston has records.
			try {
				var weeklyreport = dynamicRequire.readWeeklyReport(lastMonday);
				
						//And each transfer has six weeks
				if(typeof data[t] === 'undefined'){
					data[t] = [];
				}

				data[t][w] = {};
				//Only should be one report in there in a week...
				weeklyreport.forEach(function(currentValue, index, array){
					if(currentValue.phone == phoneNumber){
						data[t][w] = parseInt(currentValue.report);
						data[t][w]['$'] = lastMonday.getFullYear().toString()+'-'+(lastMonday.getMonth()+1).toString()+'-'+lastMonday.getDate().toString();
					}
				});
				//Clean up, now let's set the date to a week previous.
				lastMonday.setTime(lastMonday.getTime() - (7 * 24 * 60 * 60 * 1000));
			}catch(e){
				console.log(e);
			}
		}
	}*/

	res.render('area', {title: areaName, data: data, area: areaData, config: config});

});

router.get('/district/:district/war', function (req, res, next){
	var dynamicRequire = require('../helpers/dynamicRequire.js');
	var areas = dynamicRequire.readAreas();
	var config = dynamicRequire.readWeeklyReportConfig();

	var districtData = {};

for(group in areas){
	for(zone in areas[group]){
		for(district in areas[group][zone]){
			if(district == req.params.district){
				districtData = areas[group][zone][district];
			}
		}
	}
}

	res.render('district-war', 
		{title: req.params.district, 
			districtData: districtData,
			companionships: Object.keys(districtData).length,
			config: config
		});
});

router.get('/district/:district', function(req, res, next) {
	var dynamicRequire = require('../helpers/dynamicRequire.js');
	var datetime = require('../helpers/datetime.js');

	var areas = dynamicRequire.readAreas();
	var config = dynamicRequire.readWeeklyReportConfig();
	var data = [];
	var districtData = {};

	//First, we need to get the phone numbers for this district, which we will
	//do by retrieving it from the directory of areas.
	var districtName = req.params.district;
	var phoneNumbers =[];

	for(group in areas){
		for(zone in areas[group]) {
			for(district in areas[group][zone]){
				if(district == districtName){
					districtData = areas[group][zone][district];
					for(area in areas[group][zone][district]){
						phoneNumbers.push(areas[group][zone][district][area].phone);
					}
				}
			}
		}
	}

	var lastMonday = datetime.getLastMonday();
	var week = datetime.getWeekOfTransfer();

	//How many weeks back do we need on this transfer?
	var weeksBackToGet;

	//If this is week 1, we need to get all of last transfer;
	//otherwise, just get this transfers'.
	if(week == 0){
		weeksBackToGet = 6;
	}else{
		weeksBackToGet = week;
	}
	
	//OK, now we want to open up the report for the last 6 transfers, if available.

	//Since this first transfer is special, do it manually.  Note how t = 0 in for loop
	//below
	data[0]=[];
	for(var i = 0; i < weeksBackToGet; i++){
		//This one should exist...
		var weeklyreport = dynamicRequire.readWeeklyReport(lastMonday);
		data[0][i] = {};

		//Only should be one report in there in a week...
		weeklyreport.forEach(function(currentValue, index, array){
			if(phoneNumbers.indexOf(currentValue.phone) != -1){
				for(var j = 0; j < config.length; j++){
					if(typeof data[0][i][config[j].shortname] === 'undefined'){
						data[0][i][config[j].shortname] = 0;
					}
					data[0][i][config[j].shortname] += parseInt(currentValue.report[config[j].shortname]);
				}

				//data[0][i] += currentValue.report;
				//Get the date in there, $ won't ever be used as an indicator
				data[0][i]['$'] = lastMonday.getFullYear().toString()+'-'+(lastMonday.getMonth()+1).toString()+'-'+lastMonday.getDate().toString();
			}
		});
		//Clean up, now let's set the date to a week previous.
		lastMonday.setTime(lastMonday.getTime() - (7 * 24 * 60 * 60 * 1000));
	}	

	//Now to get the other weeks.
	for(var t = 1; t < 6; t++){
		for(var w = 0; w < 6; w++){
			//Now, we could theoretically bump back before Winston has records.
			try {
				var weeklyreport = dynamicRequire.readWeeklyReport(lastMonday);
				
						//And each transfer has six weeks
				if(typeof data[t] === 'undefined'){
					data[t] = [];
				}

				data[t][w] = {};
				//Only should be one report in there in a week...
				weeklyreport.forEach(function(currentValue, index, array){
					if(phoneNumbers.indexOf(currentValue.phone) != -1){
						for(var j = 0; j < config.length; j++){
							if(typeof data[t][w][config[j].shortname] === 'undefined'){
								data[t][w][config[j].shortname] = 0;
							}
							data[t][w][config[j].shortname] += parseInt(currentValue.report[config[j].shortname]);
						}
					}

					//data[0][i] += currentValue.report;
					//Get the date in there, $ won't ever be used as an indicator
					data[t][w]['$'] = lastMonday.getFullYear().toString()+'-'+(lastMonday.getMonth()+1).toString()+'-'+lastMonday.getDate().toString();
				});
				//Clean up, now let's set the date to a week previous.
				lastMonday.setTime(lastMonday.getTime() - (7 * 24 * 60 * 60 * 1000));
			}catch(err){
				console.log('Attempted to get file that doesn\'t exist: '+err);
			}

			//Clean up, now let's set the date to a week previous.
			lastMonday.setTime(lastMonday.getTime() - (7 * 24 * 60 * 60 * 1000));
		}
	}

	console.dir(data);

	res.render('district', 
		{title: districtName, 
			data: data, 
			district: districtData, 
			config: config,
			numComps: phoneNumbers.length});
});

router.get('/zone/:zone/war', function (req, res, next){
	var dynamicRequire = require('../helpers/dynamicRequire.js');
	var areas = dynamicRequire.readAreas();
	var config = dynamicRequire.readWeeklyReportConfig();

	var zoneData = {};

	for(group in areas){
		for(zone in areas[group]){
			if(zone == req.params.zone){
				zoneData = areas[group][zone];
			}
		}
	}

	res.render('zone-war', 
		{title: req.params.zone, 
			zoneData: zoneData,
			config: config
		});
});

router.get('/zone/:zone', function(req, res, next) {
	var dynamicRequire = require('../helpers/dynamicRequire.js');
	var datetime = require('../helpers/datetime.js');

	var areas = dynamicRequire.readAreas();
	var config = dynamicRequire.readWeeklyReportConfig();

	var data = [];
	var zoneData = {};

	//First, we need to get the phone numbers for this zone, which we will
	//do by retrieving it from the directory of areas.
	var zoneName = req.params.zone;
	var phoneNumbers = [];

	var areas = require('../areas/current.json');
	for(group in areas){
		for (zone in areas[group]) {
			if(zone == zoneName){
				zoneData = areas[group][zone][group];
				for(district in areas[group][zone]){
					for(area in areas[group][zone][district]){
							phoneNumbers.push(areas[group][zone][district][area].phone);
					}
				}
			}
		}
	}
	
	var week = datetime.getWeekOfTransfer();
	var lastMonday = datetime.getLastMonday();

	//How many weeks back do we need on this transfer?
	var weeksBackToGet;

	//If this is week 1, we need to get all of last transfer;
	//otherwise, just get this transfers'.
	if(week == 0){
		weeksBackToGet = 6;
	}else{
		weeksBackToGet = week;
	}
	
	//OK, now we want to open up the report for the last 6 transfers, if available.

	//Since this first transfer is special, do it manually.  Note how t = 0 in for loop
	//below
	data[0]=[];
	for(var i = 0; i < weeksBackToGet; i++){
		//This one should exist...
		var weeklyreport = dynamicRequire.readWeeklyReport(lastMonday);
		data[0][i] = {};

		//Only should be one report in there in a week...
		weeklyreport.forEach(function(currentValue, index, array){
			if(phoneNumbers.indexOf(currentValue.phone) != -1){
				for(var j = 0; j < config.length; j++){
					if(typeof data[0][i][config[j].shortname] === 'undefined'){
						data[0][i][config[j].shortname] = 0;
					}
					data[0][i][config[j].shortname] += parseInt(currentValue.report[config[j].shortname]);
				}

				//data[0][i] += currentValue.report;
				//Get the date in there, $ won't ever be used as an indicator
				data[0][i]['$'] = lastMonday.getFullYear().toString()+'-'+(lastMonday.getMonth()+1).toString()+'-'+lastMonday.getDate().toString();
			}
		});
		//Clean up, now let's set the date to a week previous.
		lastMonday.setTime(lastMonday.getTime() - (7 * 24 * 60 * 60 * 1000));
	}	

	//Now to get the other weeks.
	for(var t = 1; t < 6; t++){
		for(var w = 0; w < 6; w++){
			//Now, we could theoretically bump back before Winston has records.
			try {
				var weeklyreport = dynamicRequire.readWeeklyReport(lastMonday);
				
						//And each transfer has six weeks
				if(typeof data[t] === 'undefined'){
					data[t] = [];
				}

				data[t][w] = {};
				//Only should be one report in there in a week...
				weeklyreport.forEach(function(currentValue, index, array){
					if(phoneNumbers.indexOf(currentValue.phone) != -1){
						for(var j = 0; j < config.length; j++){
							if(typeof data[t][w][config[j].shortname] === 'undefined'){
								data[t][w][config[j].shortname] = 0;
							}
							data[t][w][config[j].shortname] += parseInt(currentValue.report[config[j].shortname]);
						}
					}

					//data[0][i] += currentValue.report;
					//Get the date in there, $ won't ever be used as an indicator
					data[t][w]['$'] = lastMonday.getFullYear().toString()+'-'+(lastMonday.getMonth()+1).toString()+'-'+lastMonday.getDate().toString();
				});
				//Clean up, now let's set the date to a week previous.
				lastMonday.setTime(lastMonday.getTime() - (7 * 24 * 60 * 60 * 1000));
			}catch(e){
				console.log(e);
			}
		}
	}
	console.log(zoneData);
	res.render('zone', 
		{title: zoneName, 
			data: data, 
			zone: zoneData, 
			config: config,
			numComps: phoneNumbers.length
		});
});

//Generate big mission report
router.get('/missiontotals', function(req, res, next) {
	var dynamicRequire = require('../helpers/dynamicRequire.js');
	var datetime = require('../helpers/datetime.js');

	var week = datetime.getWeekOfTransfer();

	//Now that we have that, we have to figure out which day is Monday
	//so we know the filenames of the number reports
	var lastMonday = datetime.getLastMonday();
	
	//Because we will mess with lastMonday, we are making a second clean copy here
	var endDate = datetime.getLastMonday();
	var startDate;

	//Now that we have last Monday, let's get the data for this transfer.
	//We will construct an object to hold the data over the transfer
	//For each zone, and then render that in a view.

	//Making the report object
	var report = {};
	var totals = [];
	var numComps = [];
	var config = dynamicRequire.readWeeklyReportConfig();
	var areas = dynamicRequire.readAreas();

	//Now, to populate it...
	//How many weeks back do we need?
	var weeksBackToGet;

	//If this is week 1, we need to get all of last transfer;
	//otherwise, just get this transfers'.
	if(week == 0){
		weeksBackToGet = 6;
	}else{
		weeksBackToGet = week;
	}

	for(var i = 0; i < weeksBackToGet; i++){
		//Get the reports
		var weeklyreport = dynamicRequire.readWeeklyReport(lastMonday);

		//Init array to hold number of companionships
		numComps[i] = {};
		numComps[i].totals = 0;
		//Now, iterate over each report in there and add it to the report object and totals object
		weeklyreport.forEach(function(currentValue, index, array){
			//What zone is this in?
			var phoneNumber = currentValue.phone;
			var reportingZone;
			
			//Search for zone based off of phone number
			Object.keys(areas).forEach(function(zone, index) {
				Object.keys(areas[group][zone]).forEach(function(district, index) {
					Object.keys(areas[group][zone][district]).forEach(function(area, index) {
						if(areas[group][zone][district][area].phone == phoneNumber){
							//Then this is the right zone!
							reportingZone = zone;
						}
					});
				});
			});

			if(typeof reportingZone === 'undefined'){
				console.log('undefined PHONE NUMBER: '+phoneNumber);
			}

			if(typeof numComps[i][reportingZone] === 'undefined'){
				numComps[i][reportingZone] = 0;
			}

			numComps[i].totals++;
			numComps[i][reportingZone]++;

			//So, now we have the zone.  Let's go through and add it to the report
			//object, iterating through all the indicators.
			for(var j = 0; j < config.length; j++){
				
				//Initializing the week/zone if it needs to be
				if(typeof report[reportingZone] === 'undefined'){
					//console.log('report['+reportingZone+'] is undefined');
					report[reportingZone] = [];
				}
				if(typeof report[reportingZone][i] === 'undefined'){
					//console.log('report['+reportingZone+']['+i+'] is undefined');
					report[reportingZone][i] = {};
				}
				if(typeof report[reportingZone][i][config[j]['shortname']] === 'undefined'){
					//console.log('report['+reportingZone+']['+i+']['+config[j]['shortname']+'] is undefined')
					report[reportingZone][i][config[j]['shortname']] = 0;
				}
				//report[i][config[j]['shortname']] = currentValue['report'][config[j]['shortname']];
				//console.log('Adding '+currentValue['report'][config[j]['shortname']]+' to '+config[j]['shortname']+'s for '+reportingZone);
				report[reportingZone][i][config[j]['shortname']] += parseInt(currentValue['report'][config[j]['shortname']]);
			}

			for(var j = 0; j < config.length; j++){
				//Initializing the week/zone if it needs to be
				if(typeof totals[i] === 'undefined'){
					totals[i] = {};
				}
				if(typeof totals[i][config[j]['shortname']] === 'undefined'){
					totals[i][config[j]['shortname']] = 0;
				}
				totals[i][config[j]['shortname']] += parseInt(currentValue['report'][config[j]['shortname']]);
			}
		});

	//Clean up, now let's set the date to a week previous.
	lastMonday.setTime(lastMonday.getTime() - (7 * 24 * 60 * 60 * 1000));
	}

	startDate = lastMonday;

	//Reversing, week 1 at top, week 6 at end
	for(key in report){
		report[key].reverse();
	}

	totals.reverse();

	//console.log(JSON.stringify(report));
	//console.log(JSON.stringify(totals));

	console.dir(report);

	res.render('missiontotals', 
		{report: report, 
			title: 'Mission Totals',
			numComps: numComps,
			totals: totals,
			config: config, 
			start: startDate, 
			end: endDate}
	);
});

module.exports = router;