module.exports = {
	read: function(fileName){
		console.log('Reading '+fileName);
		var jsonfile = require('jsonfile');
		return jsonfile.readFileSync(__dirname+'/'+fileName);
	},

	readWeeklyReport: function(date){
		return this.read('../weeklyreports/'+date.getDate().toString()+'-'+(date.getMonth()+1).toString()+'-'+date.getFullYear().toString()+'.json')
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
		this.write('../weeklyreports/'+date.getDate().toString()+'-'+(date.getMonth()+1).toString()+'-'+date.getFullYear().toString()+'.json', object);
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
	}
}