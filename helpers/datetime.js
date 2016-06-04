module.exports = {
	//Get the Date object for last Monday
	getLastMonday: function(){
		return this.getLastMondayFromDate(new Date());
	},

	getLastMondayFromDate: function(date){
		var beginning = new Date("5/2/2011"); //Date that seems to be the beginning of Skynet
		var now = date;
		var day = now.getDay();
		var lastMonday = new Date(now.setDate(now.getDate() - day + (day == 0 ? -6:1)));

		return lastMonday;
	},

	//Get the week of the transfer, starting with zero
	getWeekOfTransfer: function(fileName, object){
		var beginning = new Date("5/2/2011"); //Date that seems to be the beginning of Skynet
		var now = new Date();
		var timeDiff = Math.abs(now.getTime() - beginning.getTime());
		var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24)); 
		var diffWeeks = Math.floor(diffDays/7);
		var week = (diffWeeks % 6); //Week 1 is 0, Week 3 is 2, etc., since we start with zero

		console.log(week);

		return week;
	}
}