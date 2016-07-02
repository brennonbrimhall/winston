var express = require('express');
var router = express.Router();
var xlsx = require('xlsx');

router.get('/import', function(req, res, next) {
	var dynamicRequire = require('../helpers/dynamicRequire.js');
	var areas = dynamicRequire.readAreas();

	if(req.query.success == 'true'){
		res.render('import', {title: 'Import', alert: {type: 'success', title: 'Upload successful!', body: 'Your upload was successful!'}});
	}else if(req.query.success == 'false'){
		res.render('import', {title: 'Import', alert: {type: 'warning', title: 'Upload failed!', body: 'Your upload was not successful!'}});
	}else{
		res.render('import', {title: 'Import', areas: areas});
	}
});

router.post('/import/roster', function(req, res, next){
	var dynamicRequire = require('../helpers/dynamicRequire.js');
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

		console.dir(req.files.uploadroster);

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

		console.dir(data);

		//Now, transforming into what we really want:
		var roster = {}; //Blank document we want to save.
		var areas = {}; //Also, we want a document that has area and then the missionaries assigned
		for (var i = 0; i < data.length; i++){
			//Since the roster skips every other row, we 
			//do a mod of 2 to see if we are on an even
			//row before we put things into the document.
			//Otherwise, they may not exist!

			if(i % 2 == 0 && typeof data[i] !== 'undefined'){
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

				//Get zone and mission group from the zone name
				var rawZoneName = data[i]['Zone'];
				var startIndex = rawZoneName.indexOf(' (');
				var endIndex = rawZoneName.indexOf(')');

				var zoneName = rawZoneName.substring(0, startIndex);
				var missionGroup = rawZoneName.substring((startIndex+2), endIndex);

				roster[data[i]['Missionary ID']].zone = zoneName;
				roster[data[i]['Missionary ID']].group = missionGroup;
				roster[data[i]['Missionary ID']].district = data[i]['District'];
				roster[data[i]['Missionary ID']].area = data[i]['Area'];
				//roster[data[i]['Missionary ID']].releaseDate = data[i]['Release Date'];  This is garbage!
				

				//areas.zone.district.area	.phone
				//							.missionaries

				//Checking to see if stuff has already been initalized, if not, initalizing.

				//Mission Group
				if(typeof areas[missionGroup] === 'undefined'){
					areas[missionGroup] = {};
				}

				//Zones
				if(typeof areas[missionGroup][zoneName] === 'undefined'){
					areas[missionGroup][zoneName] = {};
				}

				//Districts
				if(typeof areas[missionGroup][zoneName][data[i]['District']] === 'undefined'){
					areas[missionGroup][zoneName][data[i]['District']] = {};
				}

				//Areas
				if(typeof areas[missionGroup][zoneName][data[i]['District']][data[i]['Area']] === 'undefined'){
					areas[missionGroup][zoneName][data[i]['District']][data[i]['Area']] = {};
				}

				//Phone Number
				if(typeof areas[missionGroup][zoneName][data[i]['District']][data[i]['Area']]['phone'] === 'undefined'){
					areas[missionGroup][zoneName][data[i]['District']][data[i]['Area']]['phone'] = data[i]['Phone'];
				}

				//Seeing if array for missionaries has been initialized
				if(typeof areas[missionGroup][zoneName][data[i]['District']][data[i]['Area']]['missionaries'] === 'undefined'){
					areas[missionGroup][zoneName][data[i]['District']][data[i]['Area']]['missionaries'] = [];
				}

				areas[missionGroup][zoneName][data[i]['District']][data[i]['Area']]['missionaries'].push(data[i]['Name']);
			}
		}

		//Writing one file as this with a timestamp, then writing it as currentorganization.json
		var timestamp = Date.now();

		dynamicRequire.writeRoster(roster);
		dynamicRequire.writeAreas(areas);

		res.render('import', { title: 'Areas', alert: {type: 'success', title: 'Upload successful!', body: 'Your upload of '+req.files.uploadroster.filename+' was successful!'} });
	}else{
		res.render('import', { title: 'Areas', alert: {type: 'danger', title: 'Upload failed!', body: 'I\'m sorry, but your upload of '+req.files.uploadroster.filename+' was unsuccessful.  Are you sure that it is a .xlsx file?'} });
	}
});

router.post('/import/board', function(req, res, next){
	var dynamicRequire = require('../helpers/dynamicRequire.js');
	//Load the file into our database!
	//The roster is saved, open and parse with module xlsx
	
	//Verifying that we are looking at an excel file!
	console.dir(req.files.uploadtransferboard);
	if(req.files.uploadtransferboard.mimetype == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'){
		//Parsing it with xlsx module
		console.dir(req.files.uploadtransferboard);

		//This code taken from http://stackoverflow.com/questions/30859901/parse-xlsx-with-node-and-create-json
		//Parsing roster:
		var data = [];
		var workbook = xlsx.readFile(req.files.uploadtransferboard.file);
		var worksheet = workbook.Sheets['Sheet0'];

		data = xlsx.utils.sheet_to_row_object_array(worksheet);

		console.dir(data);
		//Data already is in usable form! :)
		dynamicRequire.writeTransferBoard(data);

		res.redirect('/import?success=true')
	}else{
		res.redirect('/import?success=false');
	}
});

router.post('/import/transfer-planning', function(req, res, next){
	var dynamicRequire = require('../helpers/dynamicRequire.js');
	//Load the file into our database!
	//The roster is saved, open and parse with module xlsx
	
	//Verifying that we are looking at an excel file!
	if(req.files.uploadtransferplanning.mimetype == 'application/vnd.ms-excel'){
		//Parsing it with xlsx module
		console.dir(req.files.uploadtransferplanning);

		//This code taken from http://stackoverflow.com/questions/30859901/parse-xlsx-with-node-and-create-json
		//Parsing roster:
		var data = [];
		var workbook = xlsx.readFile(req.files.uploadtransferplanning.file);
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

		console.dir(data);

		//Data already is in usable form! :)
		dynamicRequire.writeTransferPlanning(data);

		res.redirect('/import?success=true')
	}else{
		res.redirect('/import?success=false');
	}
});

router.post('/import/picture', function(req, res, next){
	var dynamicRequire = require('../helpers/dynamicRequire.js');
	//Load the file into our database!
	//The roster is saved, open and parse with module xlsx
	console.dir(req.files);
	
	//Verifying that we are looking at an excel file!
	if(req.files.picture.mimetype == 'image/jpeg'){
		//Parsing it with xlsx module
		var fs = require('fs');
		fs.renameSync(req.files.picture.file, __dirname+'/../public/images/'+req.body.id+'.jpeg')
		//fs.writeFileSync(__dirname+'/../public/images/'+req.body.id+'.jpeg', fs.readFileSync(req.files.picture.file), {encoding: null});
		//res.json(req.body);
		res.redirect('/import?success=true')
	}else{
		res.redirect('/import?success=false');
	}
});

module.exports = router;