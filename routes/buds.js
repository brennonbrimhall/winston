var express = require('express');
var router = express.Router();

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

router.get('/buds/year-to-date-baptisms-graph', function(req, res, next){
	var dynamicRequire = require('../helpers/dynamicRequire.js');
	var units = dynamicRequire.read('../buds/units.json');

	res.render('buds-bap-graph', {title: 'Baptisms Chart', units: units});
});

router.get('/buds/how-found-graph', function(req, res, next){
	res.render('buds-how-found-graph', {title: 'How Found Chart'});
});

router.get('/buds/year-to-date-baptisms-data', function(req, res, next){
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

router.get('/buds/how-found-data', function(req, res, next){
	var dynamicRequire = require('../helpers/dynamicRequire.js');
	var buds = dynamicRequire.readBUDs();
	var howFoundData = {};
	howFoundData.F = 0;
	howFoundData.L = 0;
	howFoundData.M = 0;
	howFoundData.O = 0;
	howFoundData.P = 0;
	howFoundData.S = 0;
	howFoundData.U = 0;
	howFoundData.X = 0;
	for(var i = 0; i < buds.length; i++){
		var method = buds[i].method.toLowerCase();
		if(method === "f"){
			howFoundData.F++;
		}else if(method === "l"){
			howFoundData.L++;
		}else if(method === "m"){
			howFoundData.M++;
		}else if(method === "o"){
			howFoundData.O++;
		}else if(method === "p"){
			howFoundData.P++;
		}else if(method === "s"){
			howFoundData.S++;
		}else if(method === "u"){
			howFoundData.U++;
		}else{
			howFoundData.X++;
		}
	}
	res.json(howFoundData);
})

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

module.exports = router;