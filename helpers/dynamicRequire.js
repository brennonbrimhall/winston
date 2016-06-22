module.exports = {
	read: function(fileName){
		console.log('Reading '+fileName);
		var jsonfile = require('jsonfile');
		return jsonfile.readFileSync(__dirname+'/'+fileName);
	},

	readWeeklyReport: function(date){
		return this.read('../weeklyreports/'+date.getFullYear().toString()+'-'+(date.getMonth()+1).toString()+'-'+date.getDate().toString()+'.json')
	},

	readWeeklyReportConfig: function(){
		return this.read('../weeklyreports/config.json');
	},

	readAreas: function(){
		return this.read('../areas/current.json');
	},

	readRoster: function(){
		return this.read('../rosters/current.json');
	},

	readBUDs: function(){
		return this.read('../buds/buds.json');
	},

	readTransferBoard: function(){
		return this.read('../board/current.json');
	},

	readTransferPlanning: function(){
		return this.read('../transfer-planning/current.json');
	},

	write: function(fileName, object){
		var jsonfile = require('jsonfile');
		jsonfile.writeFileSync(__dirname+'/'+fileName, object);
	},

	writeWeeklyReport: function(date, object){
		this.write('../weeklyreports/'+date.getFullYear().toString()+'-'+(date.getMonth()+1).toString()+'-'+date.getDate().toString()+'.json', object);
	},

	writeWeeklyReportConfig: function(object){
		this.write('../weeklyreports/config.json', object);
	},

	writeAreas: function(object){
		var date = new Date();
		this.write('../areas/'+date.getFullYear().toString()+'-'+(date.getMonth()+1).toString()+'-'+date.getDate().toString()+'.json', object);
		this.write('../areas/current.json', object);
	},

	writeRoster: function(object){
		var date = new Date();
		this.write('../rosters/'+date.getFullYear().toString()+'-'+(date.getMonth()+1).toString()+'-'+date.getDate().toString()+'.json', object);
		this.write('../rosters/current.json', object);
	},

	writeBUDs: function(object){
		this.write('../buds/buds.json', object);
	},

	writeTransferBoard: function(object){
		var date = new Date();
		this.write('../board/current.json', object);
		this.write('../board/'+date.getFullYear().toString()+'-'+(date.getMonth()+1).toString()+'-'+date.getDate().toString()+'.json', object);
	},

	writeTransferPlanning: function(object){
		var date = new Date();
		this.write('../transfer-planning/current.json', object);
		this.write('../transfer-planning/'+date.getFullYear().toString()+'-'+(date.getMonth()+1).toString()+'-'+date.getDate().toString()+'.json', object);
	},

	getDateModified: function(fileName){
		var fs = require('fs');
		var util = require('util');
		var stats = fs.statSync(__dirname+'/'+fileName);
		var mtime = new Date(util.inspect(stats.mtime));
		return mtime;
	},

	getAreasDateModified: function(){
		return this.getDateModified('../areas/current.json');
	},

	getTransferBoardDateModified: function(){
		var date = this.getDateModified('../board/current.json');
		return date;
	},

	getTransferPlanningDateModified: function(){
		var date = this.getDateModified('../transfer-planning/current.json');
		return date;
	}
}