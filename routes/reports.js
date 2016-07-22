var express = require('express');
var router = express.Router();

router.get('/reports/stl/war', function(req, res, next) {
	var dynamicRequire = require('../helpers/dynamicRequire.js');

	var config = dynamicRequire.readWeeklyReportConfig();
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

	//Take out any senior couples
	for(group in areas){
		for(zone in areas[group]){
			for(district in areas[group][zone]){
				for(area in areas[group][zone][district]){
					if(area.toLowerCase().includes('senior')){
						delete areas[group][zone][district][area];
					}
				}
			}
		}
	}

	//Now, add the reports to the area object!
	for(group in areas){
		for(zone in areas[group]){
			if(zone !== 'MISSION OFFICE'){
				for(district in areas[group][zone]){
					for(area in areas[group][zone][district]){
						//Make sure we don't deal with senior couples
						//Find report by phone number
						for(var i = 0; i < reports.length; i++){
							if(areas[group][zone][district][area].phone == reports[i].phone){
								//Get total lessons
								var totalLessons = 0;
								for(var j = 0; j < config.length; j++){
									if(config[j].totallessons){
										totalLessons += parseInt(reports[i].report[config[j].shortname]);
									}
								}

								//Sneak total lessons in...
								config.push({name: "Total Lessons", shortname: "tl", totallessons: false});

								areas[group][zone][district][area].report = {};
								areas[group][zone][district][area].report = reports[i].report;

								//Sneak total lessons in
								areas[group][zone][district][area].report.tl = totalLessons;

								//Now, add totals to mission, group, zone, and district
								if(typeof areas.report === 'undefined'){
									areas.report = {};
									for(var j = 0; j < config.length; j++){
										areas.report[config[j].shortname] = 0;
									}
								}

								for(var j = 0; j < config.length; j++){
									var value = areas[group][zone][district][area].report[config[j].shortname];
									if(typeof value === 'undefined'){
										value = 0;
									}
									areas.report[config[j].shortname] += parseInt(value);
								}

								if(typeof areas[group].report === 'undefined'){
									areas[group].report = {};
									for(var j = 0; j < config.length; j++){
										areas[group].report[config[j].shortname] = 0;
									}
								}

								for(var j = 0; j < config.length; j++){
									var value = areas[group][zone][district][area].report[config[j].shortname];
									if(typeof value === 'undefined'){
										value = 0;
									}
									areas[group].report[config[j].shortname] += parseInt(value);
								}

								if(typeof areas[group][zone].report === 'undefined'){
									areas[group][zone].report = {};
									for(var j = 0; j < config.length; j++){
										areas[group][zone].report[config[j].shortname] = 0;
									}
								}

								for(var j = 0; j < config.length; j++){
									var value = areas[group][zone][district][area].report[config[j].shortname];
									if(typeof value === 'undefined'){
										value = 0;
									}
									areas[group][zone].report[config[j].shortname] += parseInt(value);
								}

								if(typeof areas[group][zone][district].report === 'undefined'){
									areas[group][zone][district].report = {};
									for(var j = 0; j < config.length; j++){
										areas[group][zone][district].report[config[j].shortname] = 0;
									}
								}

								for(var j = 0; j < config.length; j++){
									var value = areas[group][zone][district][area].report[config[j].shortname];
									if(typeof value === 'undefined'){
										value = 0;
									}
									areas[group][zone][district].report[config[j].shortname] += parseInt(value);
								}

								//Sneak total lessons out...
								config.pop();

							}
						}
					}
				}
			}
		}
	}
	
	console.dir(areas);

	//Sneak total lessons in again...
	config.push({name: "Total Lessons", shortname: "tl", totallessons: false});

	res.render('weekly-war', {title: 'Weekly WAR - '+datetime.getShortDate(lastMonday), areas: areas, lastMonday: lastMonday, config: config, reportForZone: reportForZone});
});

router.get('/reports/smr', function(req, res, next) {
	var dynamicRequire = require('../helpers/dynamicRequire.js');

	var areas = dynamicRequire.readAreas();
	var roster = dynamicRequire.readRoster();
	var transferPlanning = dynamicRequire.readTransferPlanning();
	//var transferBoard = dynamicRequire.readTransferBoard();
	var organizationRoster = dynamicRequire.readOrganizationRoster();

	var reportsUpdated = {};
	reportsUpdated.areas = dynamicRequire.getAreasDateModified();
	reportsUpdated.transferPlanning = dynamicRequire.getTransferPlanningDateModified();
	console.log(reportsUpdated.transferPlanning);
	reportsUpdated.organizationRoster = dynamicRequire.getOrganizationRosterDateModified();
	console.log(reportsUpdated.organizationRoster);

	//See if we have a zone to get for...
	var reportForZone = '';
	if(typeof req.query.zone !== 'undefined'){
		reportForZone = req.query.zone;
	}

	//console.dir(transferPlanning);
	console.log(reportForZone);
	res.render('smr', {title: 'Mission Directory', areas: areas, roster: roster, transferPlanning: transferPlanning, organizationRoster: organizationRoster, reportForZone: reportForZone, reportsUpdated: reportsUpdated});
});

module.exports = router;