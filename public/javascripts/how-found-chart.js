var globalColors = {
	internalColors: ['#1f77b4',
		'#ff7f0e',
		'#2ca02c',
		'#d62728',
		'#9467bd',
		'#8c564b',
		'#e377c2',
		'#7f7f7f',
		'#bcbd22',
		'#17becf'],
	get: function(id){
		return this.internalColors[id % this.internalColors.length];
	}

};

$.getJSON('/buds/how-found-data', function(data){
	var labels = [
		"Missionary Contact",
		"LDS Media Referral",
		"Member Referral",
		"OYM",
		"Part-Member Family",
		"Self-Referral",
		"Unbaptized Child",
		"Unknown"
	];

	var howFoundData = [
		data.F,
		data.L,
		data.M,
		data.O,
		data.P,
		data.S,
		data.U,
		data.X
	];

	var total = 0;
	for(var i = 0; i < howFoundData.length; i++){
		total += howFoundData[i];
	}
	for(var i = 0; i < howFoundData.length; i++){
		labels[i] = labels[i]+" ("+String(Math.round(howFoundData[i]/total*100))+"%)"
	}

	var colorsForMethod = [];

	for(var i = 0; i < howFoundData.length; i++){
		colorsForMethod.push(globalColors.get(i));
	}

	var stakeTotals = new Chart($('#how-found'), {
		type: 'pie',
		data: {
			labels: labels,
			datasets: [{
				//label: (new Date().getFullYear().toString())+' Baptisms - '+ data.units[i].name,
				data: howFoundData,
				backgroundColor: colorsForMethod,
				borderColor: colorsForMethod,
				borderWidth: 1
			}]
		},
		scaleOverride: true,
		scaleSteps: 1,
		scaleStartValue: 0,
		options: {
			animation: {
				duration: 0
			}
		}
	})
	window.print();
});