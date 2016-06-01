module.exports = {
	read: function(fileName){
		var jsonfile = require('jsonfile');
		return jsonfile.readFileSync(__dirname+'/'+fileName);
	},

	write: function(fileName, object){
		var jsonfile = require('jsonfile');
		jsonfile.writeFileSync(fileName, object);
	}
}