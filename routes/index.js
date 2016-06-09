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

router.get('/reports/stl/war', function(req, res, next) {
	var dynamicRequire = require('../helpers/dynamicRequire.js');

	config = dynamicRequire.read('../weeklyreports/config.json');
	res.render('stl-war', { title: 'Winston', config: config});
});

router.get('/buds/enter', function(req, res, next){
	var dynamicRequire = require('../helpers/dynamicRequire.js');

	var roster = dynamicRequire.readRoster();
	var units = dynamicRequire.read('../buds/units.json');

	if(typeof req.query['last-name'] === 'undefined'){
		if(req.query['success'] == 'true'){
			res.render('buds-enter', {title: 'Enter BUDs', alert: {type: 'success', title: 'Record Added!', body: 'I was able to add your record to the Baptism Utility Database.'}, roster: roster, units: units});
		}else if(req.query['success'] == 'false'){
			res.render('buds-enter', {title: 'Enter BUDs', alert: {type: 'danger', title: 'I Failed!', body: 'I wasn\'t able to add your record to the Baptism Utility Database.'}, roster: roster, units: units});
		}else{
			res.render('buds-enter', {title: 'Enter BUDs', roster: roster, units: units});
		}

	}else{
		//Save this record!
		var budRecord = {};
		budRecord.lastName = req.query['last-name'];
		budRecord.firstName = req.query['first-name'];
		budRecord.cmf = req.query.cmf;
		budRecord.method = req.query.method;
		budRecord.bapDate = req.query['bap-date'];
		budRecord.confDate = req.query['conf-date'];
		
		//Get Stake Name and ID number
		budRecord.stakeName = req.query['stake'];

		var stakeIndexNumber;
		for(var i = 0; i < units.length; i++){
			if(units[i].name == req.query['stake']){
				budRecord.stakeID = units[i].id;
				stakeIndexNumber = i;
			}
		}

		//Get Unit Name and ID number
		budRecord.unitName = req.query['unit'];
		for(var i = 0; i < units[stakeIndexNumber].units.length; i++){
			if(units[stakeIndexNumber].units[i].name == req.query['unit']){
				budRecord.unitID = units[stakeIndexNumber].units[i].id;
			}
		}

		budRecord.seniorCompanion = req.query['senior-companion'];
		budRecord.juniorCompanion = req.query['junior-companion'];
		budRecord.thirdCompanion = req.query['third-compainon'];

		var buds;
		try{
			buds = dynamicRequire.readBUDs();
		}catch(err){
			console.log('Error when getting BUDS: '+err);
			buds = [];
		}

		buds.push(budRecord);
		dynamicRequire.writeBUDs(buds);
		res.redirect('/buds/enter?success=true');
	}
});

router.get('/buds/edit/:id', function(req, res, next){
	var dynamicRequire = require('../helpers/dynamicRequire.js');

	var roster = dynamicRequire.readRoster();
	var buds = dynamicRequire.readBUDs();
	var units = dynamicRequire.read('../buds/units.json');

	var id = req.params.id;

	console.log(id);

	if(typeof req.query['last-name'] === 'undefined'){
		//Display a page for updating.

		var record = buds[id];
		record.id = id;
		res.render('buds-edit', {title: 'Edit BUD record', record: record, roster: roster, units: units});

		console.log(id);
	}else{
		//Update, redirect to view database.
		var budRecord = {};
		budRecord.lastName = req.query['last-name'];
		budRecord.firstName = req.query['first-name'];
		budRecord.cmf = req.query.cmf;
		budRecord.method = req.query.method;
		budRecord.bapDate = req.query['bap-date'];
		budRecord.confDate = req.query['conf-date'];
		
		//Get Stake Name and ID number
		budRecord.stakeName = req.query['stake'];

		var stakeIndexNumber;
		for(var i = 0; i < units.length; i++){
			if(units[i].name == req.query['stake']){
				budRecord.stakeID = units[i].id;
				stakeIndexNumber = i;
			}
		}

		//Get Unit Name and ID number
		budRecord.unitName = req.query['unit'];
		for(var i = 0; i < units[stakeIndexNumber].units.length; i++){
			if(units[stakeIndexNumber].units[i].name == req.query['unit']){
				budRecord.unitID = units[stakeIndexNumber].units[i].id;
			}
		}

		budRecord.seniorCompanion = req.query['senior-companion'];
		budRecord.juniorCompanion = req.query['junior-companion'];
		budRecord.thirdCompanion = req.query['third-compainon'];

		console.dir(budRecord);
		console.log(req.params.id);
		buds[req.params.id] = budRecord;

		console.dir(buds);

		dynamicRequire.writeBUDs(buds);

		res.redirect('/buds/view');
	}
	
});

router.get('/buds/delete/:id', function(req, res, next){
	var dynamicRequire = require('../helpers/dynamicRequire.js');
	var buds = dynamicRequire.readBUDs();

	var id = req.params.id;

	buds.splice(id, 1);

	dynamicRequire.writeBUDs(buds);

	res.redirect('/buds/view');
	
});

router.get('/buds/view', function(req, res, next){
	var dynamicRequire = require('../helpers/dynamicRequire.js');

	var roster = dynamicRequire.readRoster();
	var units = dynamicRequire.read('../buds/units.json');
	var buds = dynamicRequire.readBUDs();

	res.render('buds-view', {title: 'View BUDs', buds: buds, units: units, roster: roster});
});

router.get('/buds/graph', function(req, res, next){
	var dynamicRequire = require('../helpers/dynamicRequire.js');
	var units = dynamicRequire.read('../buds/units.json');

	res.render('buds-graph', {title: 'Baptisms Chart', units: units});
});

router.get('/buds/graph-data', function(req, res, next){
	//Make data object to be loaded by AJAX to view chart.
	var dynamicRequire = require('../helpers/dynamicRequire.js');

	var roster = dynamicRequire.readRoster();
	var units = dynamicRequire.read('../buds/units.json');
	var buds = dynamicRequire.readBUDs();

	for(var i = 0; i < units.length; i++){
		units[i].baptisms = 0;
		for(var j = 0; j < units[i].units.length; j++){
			units[i].units[j].baptisms = 0;
		}
	}

	var total = 0;

	for(var i = 0; i < buds.length; i++){
		var date = new Date(buds[i].confDate);
		var now = new Date();

		//If it is for this current year, add it to the units object
		if(date.getFullYear() == now.getFullYear()){
			//Go by unit numbers in case of boundary changes
			for(var j = 0; j < units.length; j++){
				if(units[j].id == buds[i].stakeID){
					//Then increment the baptisms for the stake
					units[j].baptisms++;
					total++;
					for(var k = 0; k < units[j].units.length; k++){
						//Increment the baptisms for the ward
						if(units[j].units[k].id == buds[i].unitID){
							units[j].units[k].baptisms++;
						}
					}
					
				}
			}
		}
	}

	res.json({total: total, units: units});
});

router.get('/buds/year-to-date-baptisms', function(req, res, next){
	var dynamicRequire = require('../helpers/dynamicRequire.js');

	var roster = dynamicRequire.readRoster();
	var units = dynamicRequire.read('../buds/units.json');
	var buds = dynamicRequire.readBUDs();

	//We are going to add to the units object a baptisms property with the number of baptisms
	//In each stake and unit for a nice, pretty display.

	for(var i = 0; i < units.length; i++){
		units[i].baptisms = 0;
		for(var j = 0; j < units[i].units.length; j++){
			units[i].units[j].baptisms = 0;
		}
	}

	var total = 0;

	for(var i = 0; i < buds.length; i++){
		var date = new Date(buds[i].confDate);
		var now = new Date();

		//If it is for this current year, add it to the units object
		if(date.getFullYear() == now.getFullYear()){
			//Go by unit numbers in case of boundary changes
			for(var j = 0; j < units.length; j++){
				if(units[j].id == buds[i].stakeID){
					//Then increment the baptisms for the stake
					units[j].baptisms++;
					total++;
					for(var k = 0; k < units[j].units.length; k++){
						//Increment the baptisms for the ward
						if(units[j].units[k].id == buds[i].unitID){
							units[j].units[k].baptisms++;
						}
					}
					
				}
			}
		}
	}

	console.dir(units);

	res.render('buds-baptisms-for-year', {title: 'Year to Date Baptisms', buds: buds, units: units, roster: roster, total: total});
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
	
	for(zone in areas){
		if(zone != "MISSION OFFICE"){
			for (district in areas[zone]){
				for (area in areas[zone][district]){
					data[i] = {};
					data[i].area = areas[zone][district][area];
					data[i].zoneName = zone;
					data[i].districtName = district;
					data[i].areaName = area;
					data[i].endingOdometer = 0;
					data[i].estimated = 0;

					//Getting ending miles from report
					for(var j = 0; j < weeklyReport.length; j++){
						if(areas[zone][district][area].phone == weeklyReport[j].phone){
							data[i].endingOdometer = weeklyReport[j].report.miles;
						}
					}

					//Getting ending miles from previous report to caculate weekly usage,
					//then using that to estimate the monthly ending odometer.
					var weeksToInterpolate = (d.getDate() - lastMonday.getDate())/7;

					for(var j = 0; j < previousWeeklyReport.length; j++){
						if(areas[zone][district][area].phone == previousWeeklyReport[j].phone){
							data[i].estimated = data[i].endingOdometer + weeksToInterpolate*(data[i].endingOdometer - previousWeeklyReport[j].report.miles);
						}
					}

					i++;
				}
			}
		}
	}

	console.dir(data);

	res.render('miles', {title: 'Month End Miles', data: data, reportedDate: lastMonday});
});

router.get('/tocall', function(req, res, next) {
	var dynamicRequire = require('../helpers/dynamicRequire.js');
	var datetime = require('../helpers/datetime.js');

	var areas = dynamicRequire.read('../areas/current.json');

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
		for(zone in areas){
			for(district in areas[zone]){
				for(area in areas[zone][district]){
					phones.push(areas[zone][district][area].phone);
				}
			}
		}

		res.redirect('/reports?success=true');

	}else{
		//No records to save
		var areas = dynamicRequire.readAreas();
		var config = dynamicRequire.readWeeklyReportConfig();
		var phones = [];

		for(zone in areas){
			for(district in areas[zone]){
				for(area in areas[zone][district]){
					phones.push({name: area, 
						phone: areas[zone][district][area].phone});
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

	var datetime = require('../helpers/datetime.js');
	var week = datetime.getWeekOfTransfer();
	var lastMonday = datetime.getLastMonday();

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
			if(currentValue.phone == phoneNumber){
				data[0][i] = parseInt(currentValue.report);
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
	}

	res.render('area', {title: areaName, data: data, area: areaData, config: config});

});

router.get('/district/:district/war', function (req, res, next){
	var dynamicRequire = require('../helpers/dynamicRequire.js');
	var areas = dynamicRequire.readAreas();
	var config = dynamicRequire.readWeeklyReportConfig();

	var districtData = {};

	for(zone in areas){
		for(district in areas[zone]){
			if(district == req.params.district){
				districtData = areas[zone][district];
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

	for(zone in areas) {
		for(district in areas[zone]){
			if(district == districtName){
				districtData = areas[zone][district];
				for(area in areas[zone][district]){
					phoneNumbers.push(areas[zone][district][area].phone);
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

	for(zone in areas){
		if(zone == req.params.zone){
			zoneData = areas[zone];
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

router.get('/import', function(req, res, next) {
	var dynamicRequire = require('../helpers/dynamicRequire.js');
	var areas = dynamicRequire.readAreas();

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
						if(area == 'LAKEWOOD/Office'){
							phones.push(areas[zone][district][area].phone);
						}
					});
				});
			}
		});

		//Now, initiating emails.
		var mailer = require('../helpers/mailer.js');

		mailer.text(phones, '', req.query.message, function(err, info){
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
