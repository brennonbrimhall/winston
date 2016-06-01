var express = require('express');
var router = express.Router();
var xlsx = require('xlsx');
var fs = require('fs');

/* GET home page. */
router.get('/', function(req, res, next) {
	var dynamicRequire = require('../helpers/dynamicRequire.js');

	format = dynamicRequire.read('../weeklyreports/config.json');
	res.render('index', { title: 'Winston', format: format});
});

router.get('/tocall', function(req, res, next) {
	var dynamicRequire = require('../helpers/dynamicRequire.js');
	var areas = dynamicRequire.read('../areas/current.json');

	//Now that we have that, we have to figure out which day is Monday
	//so we know the filenames of the number reports
	var beginning = new Date("5/2/2011"); //Date that seems to be the beginning of Skynet
	var now = new Date();
	var timeDiff = Math.abs(now.getTime() - beginning.getTime());
	var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24)); 
	var diffWeeks = Math.floor(diffDays/7);
	var week = (diffWeeks % 6) - 1; //Week 1 is 0, Week 3 is 2, etc., since we start with zero

	var day = now.getDay();
	var lastMonday = new Date(now.setDate(now.getDate() - day + (day == 0 ? -6:1)));

	console.log(lastMonday.toDateString());
	console.log('../weeklyreports/'+lastMonday.getDate().toString()+'-'+(lastMonday.getMonth()+1).toString()+'-'+lastMonday.getFullYear().toString()+'.json')

	//Get the phone numbres of those who HAVE submitted this week
	var phoneNumbers = [];
	var weeklyreports = dynamicRequire.read('../weeklyreports/'+lastMonday.getDate().toString()+'-'+(lastMonday.getMonth()+1).toString()+'-'+lastMonday.getFullYear().toString()+'.json');
	for(report in weeklyreports){
		phoneNumbers.push(weeklyreports[report].phone);
	}

	//Now, going through the areas list and if they have reported, we are NOT going to put them
	//into a new object that has a modified areas list with only those who have not reported.
	var didNotReport = {};
	for(zone in areas){
		for(district in areas[zone]){
			for(area in areas[zone][district]){
				if(phoneNumbers.indexOf(areas[zone][district][area].phone) == -1){
					if(typeof didNotReport[zone] === 'undefined'){
						didNotReport[zone] = {};
					}
					if(typeof didNotReport[zone][district] === 'undefined'){
						didNotReport[zone][district] = {};
					}
					if(typeof didNotReport[zone][district][area] === 'undefined'){
						didNotReport[zone][district][area] = {};
					}
					didNotReport[zone][district][area] = areas[zone][district][area];
					console.dir(didNotReport[zone][district][area]);
				}
			}
		}
	}

	res.render('tocall', {
		title: 'To Call',
		areas: didNotReport
	})

});

router.get('/reports', function(req, res, next) {
	var dynamicRequire = require('../helpers/dynamicRequire.js');

	if(typeof req.query.phone !== 'undefined'){
		//Save this data that we got!
		var config = dynamicRequire.read('../weeklyreports/config.json');
		var report = {};

		//get phone, date, and miles
		var phoneNumber = req.query.phone;

		var date = new Date(req.query['$']);
		var miles = req.query.miles;

		//now get everything else
		for(indicator in config){
			report[config[indicator].shortname] = req.query[config[indicator].shortname];
		}

		report.miles = miles;

		//console.log('../weeklyreports/'+date.getUTCDate().toString()+'-'+(date.getMonth()+1).toString()+'-'+date.getFullYear().toString()+'.json');

		//Do we have a file for this reporting day?
		try{
			//Get the file that holds all of this week's numbers reports
			var numbers = dynamicRequire.read('../weeklyreports/'+date.getUTCDate().toString()+'-'+(date.getMonth()+1).toString()+'-'+date.getFullYear().toString()+'.json');
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
			//Overwriting.
			numbers[overwriteIndex] = {recieved: Date.now(), phone: phoneNumber, report: report};
		}else{
			//No need to overwrite, appending.
			numbers.push({recieved: Date.now(), phone: phoneNumber, report: report});
		}

		var fs = require('fs');
		fs.writeFile('./weeklyreports/'+date.getUTCDate().toString()+'-'+(date.getMonth()+1).toString()+'-'+date.getFullYear().toString()+'.json', JSON.stringify(numbers), function(){

			var areas = dynamicRequire.read('../areas/current.json');
			var phones = [];
			for(zone in areas){
				for(district in areas[zone]){
					for(area in areas[zone][district]){
						phones.push(areas[zone][district][area].phone);
					}
				}
			}

			res.redirect('/reports?success=true');

			res.render('reports', {phones: phones, config: config, alert: {type: 'success', title: 'Update successful!', body: 'Your numbers report was saved.  Do NOT refresh the page, or go back, as that will cause the '}});
		});


	}else{
		//No records to save
		var areas = dynamicRequire.read('../areas/current.json');
		var config = dynamicRequire.read('../weeklyreports/config.json');
		var phones = [];

		for(zone in areas){
			for(district in areas[zone]){
				for(area in areas[zone][district]){
					phones.push(areas[zone][district][area].phone);
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
router.get('/areas', function(req, res, next) {
	var dynamicRequire = require('../helpers/dynamicRequire.js');
	var areas = dynamicRequire.read('../areas/current.json');
	res.render('areas', {title: 'Areas', areas: areas});	
});

router.get('/areas/:area', function(req, res, next) {
	var dynamicRequire = require('../helpers/dynamicRequire.js');
	var areas = dynamicRequire.read('../areas/current.json');
	var config = dynamicRequire.read('../weeklyreports/config.json');
	var data = [];
	var areaData = {};

	//First, we need to get the phone number for this area, which we will
	//do by correcting the area name, (since there can be a slash, we 
	//compensate by putting in a dash) and retrieving it from the directory 
	//of areas.
	var areaName = req.params.area.replace('-', '/');
	var phoneNumber;

	var areas = dynamicRequire.read('../areas/current.json');
	for (zone in areas) {
		for(district in areas[zone]){
			for(area in areas[zone][district]){
				if(area == areaName){
					phoneNumber = areas[zone][district][area].phone;
					areaData = areas[zone][district][area];
				}
			}
		}
	}

	//Now that we have that, we have to figure out which day is Monday
	//so we know the filenames of the number reports
	var beginning = new Date("5/2/2011"); //Date that seems to be the beginning of Skynet
	var now = new Date();
	var timeDiff = Math.abs(now.getTime() - beginning.getTime());
	var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24)); 
	var diffWeeks = Math.floor(diffDays/7);
	var week = (diffWeeks % 6) - 1; //Week 1 is 0, Week 3 is 2, etc., since we start with zero

	var day = now.getDay();
	var lastMonday = new Date(now.setDate(now.getDate() - day + (day == 0 ? -6:1)));

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
		var weeklyreport = dynamicRequire.read('../weeklyreports/'+lastMonday.getDate().toString()+'-'+(lastMonday.getMonth()+1).toString()+'-'+lastMonday.getFullYear().toString()+'.json');
		data[0][i] = {};

		//Only should be one report in there in a week...
		weeklyreport.forEach(function(currentValue, index, array){
			if(currentValue.phone == phoneNumber){
				data[0][i] = currentValue.report;
				//Get the date in there, $ won't ever be used as an indicator
				data[0][i]['$'] = lastMonday.getDate().toString()+'-'+(lastMonday.getMonth()+1).toString()+'-'+lastMonday.getFullYear().toString();
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
				var weeklyreport = dynamicRequire.read('../weeklyreports/'+lastMonday.getDate().toString()+'-'+(lastMonday.getMonth()+1).toString()+'-'+lastMonday.getFullYear().toString()+'.json');
				
						//And each transfer has six weeks
				if(typeof data[t] === 'undefined'){
					data[t] = [];
				}

				data[t][w] = {};
				//Only should be one report in there in a week...
				weeklyreport.forEach(function(currentValue, index, array){
					if(currentValue.phone == phoneNumber){
						data[t][w] = currentValue.report;
						data[t][w]['$'] = lastMonday.getDate().toString()+'-'+(lastMonday.getMonth()+1).toString()+'-'+lastMonday.getFullYear().toString();
					}
				});
				//Clean up, now let's set the date to a week previous.
				lastMonday.setTime(lastMonday.getTime() - (7 * 24 * 60 * 60 * 1000));
			}catch(e){
				console.log(e);
			}
		}
	}

	res.render('area', {title: areaName, data: data, area: areaData, config: config});

});

router.get('/district/:district', function(req, res, next) {
	var dynamicRequire = require('../helpers/dynamicRequire.js')
	var areas = dynamicRequire.read('../areas/current.json');
	var config = dynamicRequire.read('../weeklyreports/config.json');
	var data = [];
	var districtData = {};

	//First, we need to get the phone numbers for this zone, which we will
	//do by retrieving it from the directory of areas.
	var districtName = req.params.district;
	var phoneNumbers =[];

	var areas = dynamicRequire.read('../areas/current.json');
	for (zone in areas) {
		for(district in areas[zone]){
			if(district == districtName){
				districtData = areas[zone][district];
				for(area in areas[zone][district]){
					phoneNumbers.push(areas[zone][district][area].phone);
				}
			}
		}
	}

	//Now that we have that, we have to figure out which day is Monday
	//so we know the filenames of the number reports
	var beginning = new Date("5/2/2011"); //Date that seems to be the beginning of Skynet
	var now = new Date();
	var timeDiff = Math.abs(now.getTime() - beginning.getTime());
	var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24)); 
	var diffWeeks = Math.floor(diffDays/7);
	var week = (diffWeeks % 6) - 1; //Week 1 is 0, Week 3 is 2, etc., since we start with zero

	var day = now.getDay();
	var lastMonday = new Date(now.setDate(now.getDate() - day + (day == 0 ? -6:1)));

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
		var weeklyreport = dynamicRequire.read('../weeklyreports/'+lastMonday.getDate().toString()+'-'+(lastMonday.getMonth()+1).toString()+'-'+lastMonday.getFullYear().toString()+'.json');
		data[0][i] = {};

		//Only should be one report in there in a week...
		weeklyreport.forEach(function(currentValue, index, array){
			if(phoneNumbers.indexOf(currentValue.phone) != -1){
				for(var j = 0; j < config.length; j++){
					if(typeof data[0][i][config[j].shortname] === 'undefined'){
						data[0][i][config[j].shortname] = 0;
					}
					data[0][i][config[j].shortname] += currentValue.report[config[j].shortname];
				}

				//data[0][i] += currentValue.report;
				//Get the date in there, $ won't ever be used as an indicator
				data[0][i]['$'] = lastMonday.getDate().toString()+'-'+(lastMonday.getMonth()+1).toString()+'-'+lastMonday.getFullYear().toString();
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
				var weeklyreport = dynamicRequire.read('../weeklyreports/'+lastMonday.getDate().toString()+'-'+(lastMonday.getMonth()+1).toString()+'-'+lastMonday.getFullYear().toString()+'.json');
				
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
							data[t][w][config[j].shortname] += currentValue.report[config[j].shortname];
						}
					}

					//data[0][i] += currentValue.report;
					//Get the date in there, $ won't ever be used as an indicator
					data[t][w]['$'] = lastMonday.getDate().toString()+'-'+(lastMonday.getMonth()+1).toString()+'-'+lastMonday.getFullYear().toString();
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

router.get('/zone/:zone', function(req, res, next) {
	var dynamicRequire = require('../helpers/dynamicRequire.js')
	var areas = dynamicRequire.read('../areas/current.json');
	var config = dynamicRequire.read('../weeklyreports/config.json');
	var data = [];
	var zoneData = {};

	//First, we need to get the phone numbers for this zone, which we will
	//do by retrieving it from the directory of areas.
	var zoneName = req.params.zone;
	var phoneNumbers = [];

	var areas = require('../areas/current.json');
	for (zone in areas) {
		if(zone == zoneName){
			zoneData = areas[zone];
			for(district in areas[zone]){
				for(area in areas[zone][district]){
						phoneNumbers.push(areas[zone][district][area].phone);
				}
			}
		}
	}

	//Now that we have that, we have to figure out which day is Monday
	//so we know the filenames of the number reports
	var beginning = new Date("5/2/2011"); //Date that seems to be the beginning of Skynet
	var now = new Date();
	var timeDiff = Math.abs(now.getTime() - beginning.getTime());
	var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24)); 
	var diffWeeks = Math.floor(diffDays/7);
	var week = (diffWeeks % 6) - 1; //Week 1 is 0, Week 3 is 2, etc., since we start with zero

	var day = now.getDay();
	var lastMonday = new Date(now.setDate(now.getDate() - day + (day == 0 ? -6:1)));

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
		var weeklyreport = dynamicRequire.read('../weeklyreports/'+lastMonday.getDate().toString()+'-'+(lastMonday.getMonth()+1).toString()+'-'+lastMonday.getFullYear().toString()+'.json');
		data[0][i] = {};

		//Only should be one report in there in a week...
		weeklyreport.forEach(function(currentValue, index, array){
			if(phoneNumbers.indexOf(currentValue.phone) != -1){
				for(var j = 0; j < config.length; j++){
					if(typeof data[0][i][config[j].shortname] === 'undefined'){
						data[0][i][config[j].shortname] = 0;
					}
					data[0][i][config[j].shortname] += currentValue.report[config[j].shortname];
				}

				//data[0][i] += currentValue.report;
				//Get the date in there, $ won't ever be used as an indicator
				data[0][i]['$'] = lastMonday.getDate().toString()+'-'+(lastMonday.getMonth()+1).toString()+'-'+lastMonday.getFullYear().toString();
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
				var weeklyreport = require('../weeklyreports/'+lastMonday.getDate().toString()+'-'+(lastMonday.getMonth()+1).toString()+'-'+lastMonday.getFullYear().toString()+'.json');
				
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
							data[t][w][config[j].shortname] += currentValue.report[config[j].shortname];
						}
					}

					//data[0][i] += currentValue.report;
					//Get the date in there, $ won't ever be used as an indicator
					data[t][w]['$'] = lastMonday.getDate().toString()+'-'+(lastMonday.getMonth()+1).toString()+'-'+lastMonday.getFullYear().toString();
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

	//First of all, what week of the transfer are we on?
	var beginning = new Date("5/2/2011"); //Date that seems to be the beginning of Skynet
	var now = new Date();
	var timeDiff = Math.abs(now.getTime() - beginning.getTime());
	var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24)); 
	var diffWeeks = Math.ceil(diffDays/7);
	var week = (diffWeeks % 6)-1; //Week 1 is 0, Week 3 is 2, etc., since we start with zero
	console.log("Week:"+week);

	//Now that we have that, we have to figure out which day is Monday
	//so we know the filenames of the number reports

	var day = now.getDay();
	var lastMonday = new Date(now.setDate(now.getDate() - day + (day == 0 ? -6:1)));
	//Because we will mess with lastMonday, we are making a second clean copy here
	var endDate = new Date(now.setDate(now.getDate() - day + (day == 0 ? -6:1)));

	var startDate;

	//Now that we have last Monday, let's get the data for this transfer.
	//We will construct an object to hold the data over the transfer
	//For each zone, and then render that in a view.

	//Making the report object
	var report = {};
	var totals = [];
	var numComps = [];
	var config = dynamicRequire.read('../weeklyreports/config.json');
	var areas = dynamicRequire.read('../areas/current.json');

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
		var weeklyreport = dynamicRequire.read('../weeklyreports/'+lastMonday.getDate().toString()+'-'+(lastMonday.getMonth()+1).toString()+'-'+lastMonday.getFullYear().toString()+'.json');

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
				Object.keys(areas[zone]).forEach(function(district, index) {
					Object.keys(areas[zone][district]).forEach(function(area, index) {
						if(areas[zone][district][area].phone == phoneNumber){
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
				report[reportingZone][i][config[j]['shortname']] += currentValue['report'][config[j]['shortname']];
			}

			for(var j = 0; j < config.length; j++){
				//Initializing the week/zone if it needs to be
				if(typeof totals[i] === 'undefined'){
					totals[i] = {};
				}
				if(typeof totals[i][config[j]['shortname']] === 'undefined'){
					totals[i][config[j]['shortname']] = 0;
				}
				totals[i][config[j]['shortname']] += currentValue['report'][config[j]['shortname']];
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
			numComps: numComps,
			totals: totals,
			config: config, 
			start: startDate, 
			end: endDate}
	);
});

router.get('/import', function(req, res, next) {
	var dynamicRequire = require('../helpers/dynamicRequire.js');
	var areas = dynamicRequire.read('../areas/current.json');

	if(req.query.uploadroster == 'success'){
		res.render('import', {title: 'Import', alert: {type: 'success', title: 'Upload successful!', body: 'Your upload of the roster was successful!'}, areas: areas});	
	}else{
		res.render('Import', {title: 'Import', areas: areas});
	}
});

router.post('/import', function(req, res, next){
	//Load the file into our database!
	//The roster is saved, open and parse with module xlsx
	
	//Verifying that we are looking at an excel file!
	if(req.files.uploadroster.mimetype == 'application/vnd.ms-excel'){
		//Parsing it with xlsx module

		/*
		We'll make a JSON document from the Excel file using the xlsx
		module, essentially a copy of the roster, except we will sort 
		by missionary id.  Then we will put that into the database.

		Roster:
		missionary id 	-> name
						-> position
						-> phone number
						-> zone
						-> district
						-> area
						-> release date
		*/

		//This code taken from http://stackoverflow.com/questions/30859901/parse-xlsx-with-node-and-create-json
		//Parsing roster:
		var data = [];
		var workbook = xlsx.readFile(req.files.uploadroster.file);
	    var worksheet = workbook.Sheets['Sheet1'];
	    var headers = {};
	    for(z in worksheet) {
	        if(z[0] === '!') continue;
	        //parse out the column, row, and value
	        var col = z.substring(0,1);
	        var row = parseInt(z.substring(1));
	        var value = worksheet[z].v;

	        //store header names
	        if(row == 1) {
	            headers[col] = value;
	            continue;
	        }

	        if(!data[row]) data[row]={};
	        data[row][headers[col]] = value;
	    }
	    //drop those first two rows which are empty
	    data.shift();
	    data.shift();

		//Now, transforming into what we really want:
	    var roster = {}; //Blank document we want to save.
	    var areas = {}; //Also, we want a document that has area and then the missionaries assigned
	    for (var i = 0; i < data.length; i++){
	    	//Since the roster skips every other row, we 
	    	//do a mod of 2 to see if we are on an even
	    	//row before we put things into the document.
	    	//Otherwise, they may not exist!

	    	if(i % 2 == 0){
	    		roster[data[i]['Missionary ID']] = {};
	    		roster[data[i]['Missionary ID']].name = data[i]['Name'];

	    		//Real names for position abbreviations.
				roster[data[i]['Missionary ID']].positionAbbreviation = data[i]['Position'];
				
				if(data[i]['Position'] == '(JC)'){
					roster[data[i]['Missionary ID']].position = 'Junior Companion';
				}else if(data[i]['Position'] == '(SC)'){
					roster[data[i]['Missionary ID']].position = 'Senior Companion';
				}else if(data[i]['Position'] == '(DL)'){
					roster[data[i]['Missionary ID']].position = 'District Leader';
				}else if(data[i]['Position'] == '(DT)'){
					roster[data[i]['Missionary ID']].position = 'District Leader/Trainer';
				}else if(data[i]['Position'] == '(ZL2)'){
					roster[data[i]['Missionary ID']].position = 'Zone Leader';
				}else if(data[i]['Position'] == '(ZL1)'){
					roster[data[i]['Missionary ID']].position = 'Zone Leader';
				}else if(data[i]['Position'] == '(STL2)'){
					roster[data[i]['Missionary ID']].position = 'Sister Training Leader';
				}else if(data[i]['Position'] == '(STL1)'){
					roster[data[i]['Missionary ID']].position = 'Sister Training Leader';
				}else if(data[i]['Position'] == '(AP)'){
					roster[data[i]['Missionary ID']].position = 'Assistant to the President';
				}else if(data[i]['Position'] == '(DL)'){
					roster[data[i]['Missionary ID']].position = 'District Leader';
				}

				roster[data[i]['Missionary ID']].phone = data[i]['Phone'];
				roster[data[i]['Missionary ID']].zone = data[i]['Zone'];
				roster[data[i]['Missionary ID']].district = data[i]['District'];
				roster[data[i]['Missionary ID']].area = data[i]['Area'];
				//roster[data[i]['Missionary ID']].releaseDate = data[i]['Release Date'];  This is garbage!
				

				//areas.zone.district.area	.phone
				//							.missionaries

				//Checking to see if stuff has already been initalized, if not, initalizing.

				//Zones
				if(typeof areas[data[i]['Zone']] === 'undefined'){
					areas[data[i]['Zone']] = {};
				}

				//Districts
				if(typeof areas[data[i]['Zone']][data[i]['District']] === 'undefined'){
					areas[data[i]['Zone']][data[i]['District']] = {};
				}

				//Areas
				if(typeof areas[data[i]['Zone']][data[i]['District']][data[i]['Area']] === 'undefined'){
					areas[data[i]['Zone']][data[i]['District']][data[i]['Area']] = {};
				}

				//Phone Number
				if(typeof areas[data[i]['Zone']][data[i]['District']][data[i]['Area']]['phone'] === 'undefined'){
					areas[data[i]['Zone']][data[i]['District']][data[i]['Area']]['phone'] = data[i]['Phone'];
				}

				//Seeing if array for missionaries has been initialized
				if(typeof areas[data[i]['Zone']][data[i]['District']][data[i]['Area']]['missionaries'] === 'undefined'){
					areas[data[i]['Zone']][data[i]['District']][data[i]['Area']]['missionaries'] = [];
				}

				areas[data[i]['Zone']][data[i]['District']][data[i]['Area']]['missionaries'].push(data[i]['Name']);
	    	}
		}

		//Writing one file as this with a timestamp, then writing it as currentorganization.json
		var timestamp = Date.now();

		fs.writeFile('./rosters/'+timestamp+'.json', JSON.stringify(roster), function(){
			fs.writeFile('./rosters/current.json', JSON.stringify(roster), function(){
				fs.writeFile('./areas/'+timestamp+'.json', JSON.stringify(areas), function(){
					fs.writeFile('./areas/current.json', JSON.stringify(areas), function(){
						//TODO: Write cleanup code for uploads.
						res.render('import', { title: 'Areas', alert: {type: 'success', title: 'Upload successful!', body: 'Your upload of '+req.files.uploadroster.filename+' was successful!'} });
					});
				});	
			});		
		});
	}else{
		res.render('import', { title: 'Areas', alert: {type: 'danger', title: 'Upload failed!', body: 'I\'m sorry, but your upload of '+req.files.uploadroster.filename+' was unsuccessful.  Are you sure that it is a .xlsx file?'} });
	}
	res.json({text: 'text'})
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
		var areas = dynamicRequire.read('../areas/current.json');
		Object.keys(areas).forEach(function(zone, index){
			//Cutting out mission office
			if(zone != 'MISSION OFFICE'){
				Object.keys(areas[zone]).forEach(function(district, index){
					Object.keys(areas[zone][district]).forEach(function(area, index){
						//For testing, only send to Orchard
						if(area == 'CLEAR CREEK/TABLE MTN YSA' || area == 'LAKEWOOD/Office'){
							var number = (areas[zone][district][area].phone).slice(3)+'@txt.att.net';
							
							//Remove first dash
							number = number.replace('-', '');

							//Remove second dash
							number = number.replace('-', '');
							phones.push(number);
						}
					});
				});
			}
		});

		//console.log(phones);

		//Now, initiating emails.
		var mailer = require('../helpers/mailer.js');

		mailer.mail(phones, '', req.query.message, function(err, info){
			if(err){
				console.log(err);
				res.redirect('/sendtext?success=false');
				res.render('text', {title: 'Text the Mission', alert: {type: 'danger', title: 'Mass Text Failed!', body: err}});
			}else{
				res.redirect('/sendtext?success=true')
				res.render('text', {title: 'Text the Mission', alert: {type: 'success', title: 'Text successful!', body: 'Texting the mission was successful.'}});
			}
		});
	}
});

module.exports = router;
