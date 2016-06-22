var express = require('express');
var router = express.Router();

router.get('/reports/stl/war', function(req, res, next) {
	var dynamicRequire = require('../helpers/dynamicRequire.js');

	var config = dynamicRequire.read('../weeklyreports/config.json');
	res.render('stl-war', { title: 'Winston', config: config});
});

router.get('/reports/weekly/war', function(req, res, next) {
	var dynamicRequire = require('../helpers/dynamicRequire.js');
	var datetime = require('../helpers/datetime.js');
	var areas = dynamicRequire.readAreas();
	var config = dynamicRequire.readWeeklyReportConfig();

	//Get all the data for this week...
	var lastMonday = datetime.getLastMonday();
	var reports = dynamicRequire.readWeeklyReport(lastMonday);

	//See if we have a zone to get for...
	var reportForZone = '';
	if(typeof req.query.zone !== 'undefined'){
		reportForZone = req.query.zone;
	}

	//Now, add the reports to the area object!
	for(zone in areas){
		if(zone !== 'MISSION OFFICE'){
			for(district in areas[zone]){
				for(area in areas[zone][district]){
					//Find report by phone number
					for(var i = 0; i < reports.length; i++){
						if(areas[zone][district][area].phone == reports[i].phone){
							areas[zone][district][area].report = {};
							areas[zone][district][area].report = reports[i].report;

							//Now, add totals to mission, zone, and district
							if(typeof areas.report === 'undefined'){
								areas.report = {};
								for(var j = 0; j < config.length; j++){
									areas.report[config[j].shortname] = 0;
								}
							}

							for(var j = 0; j < config.length; j++){
								var value = areas[zone][district][area].report[config[j].shortname];
								if(typeof value === 'undefined'){
									value = 0;
								}
								areas.report[config[j].shortname] += parseInt(value);
							}

							if(typeof areas[zone].report === 'undefined'){
								areas[zone].report = {};
								for(var j = 0; j < config.length; j++){
									areas[zone].report[config[j].shortname] = 0;
								}
							}

							for(var j = 0; j < config.length; j++){
								var value = areas[zone][district][area].report[config[j].shortname];
								if(typeof value === 'undefined'){
									value = 0;
								}
								areas[zone].report[config[j].shortname] += parseInt(value);
							}

							if(typeof areas[zone][district].report === 'undefined'){
								areas[zone][district].report = {};
								for(var j = 0; j < config.length; j++){
									areas[zone][district].report[config[j].shortname] = 0;
								}
							}

							for(var j = 0; j < config.length; j++){
								var value = areas[zone][district][area].report[config[j].shortname];
								if(typeof value === 'undefined'){
									value = 0;
								}
								areas[zone][district].report[config[j].shortname] += parseInt(value);
							}

						}
					}
				}
			}
		}
	}
	
	console.log(reportForZone);

	res.render('weekly-war', {title: 'Weekly WAR - '+datetime.getShortDate(lastMonday), areas: areas, lastMonday: lastMonday, config: config, reportForZone: reportForZone});
});

router.get('/reports/smr', function(req, res, next) {
	var dynamicRequire = require('../helpers/dynamicRequire.js');

	var areas = dynamicRequire.readAreas();
	var roster = dynamicRequire.readRoster();
	var transferPlanning = dynamicRequire.readTransferPlanning();
	var transferBoard = dynamicRequire.readTransferBoard();
	
	var reportsUpdated = {};
	reportsUpdated.areas = dynamicRequire.getAreasDateModified();
	reportsUpdated.transferPlanning = dynamicRequire.getTransferPlanningDateModified();
	console.log(reportsUpdated.transferPlanning);
	reportsUpdated.board = dynamicRequire.getTransferBoardDateModified();
	console.log(reportsUpdated.board);

	//See if we have a zone to get for...
	var reportForZone = '';
	if(typeof req.query.zone !== 'undefined'){
		reportForZone = req.query.zone;
	}

	//console.dir(transferPlanning);

	res.render('smr', {title: 'Mission Directory', areas: areas, roster: roster, transferPlanning: transferPlanning, transferBoard: transferBoard, reportForZone: reportForZone, reportsUpdated: reportsUpdated});
});

module.exports = router;