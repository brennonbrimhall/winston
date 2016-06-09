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

$.getJSON('/buds/graph-data', function(data){
	//Main graph
	var unitsForStakeTotals = [];
	var baptismsForStakeTotals = [];
	var colorsForStakeTotals = [];

	for(var i = 0; i < data.units.length; i++){
		unitsForStakeTotals.push(data.units[i].name);
		baptismsForStakeTotals.push(data.units[i].baptisms)
		colorsForStakeTotals.push(globalColors.get(i));
	}

	var stakeTotals = new Chart($('#stake-totals'), {
		type: 'bar',
		data: {
			labels: unitsForStakeTotals,
			datasets: [{
				//label: (new Date().getFullYear().toString())+' Baptisms - '+ data.units[i].name,
				data: baptismsForStakeTotals,
				backgroundColor: colorsForStakeTotals,
				borderColor: colorsForStakeTotals,
				borderWidth: 1
			}]
		},
		scaleOverride: true,
		scaleSteps: 1,
		scaleStartValue: 0,
		options: {
			animation: false,
			legend: {
				display: false
			}
		}
	})

	//Individual stakes
	for(var i = 0; i < data.units.length; i++){
		//Now, make an array of the wards in the stake
		var units = [];
		var baptisms = [];
		var colors = [];
		for(var j = 0; j < data.units[i].units.length; j++){
			units.push(data.units[i].units[j].name);
			baptisms.push(data.units[i].units[j].baptisms)
			colors.push(globalColors.get(j));
		}

		var ctx = $('#'+data.units[i].id);
		var chart = new Chart(ctx, {
			type: 'bar',
			data: {
				labels: units,
				datasets: [{
					//label: (new Date().getFullYear().toString())+' Baptisms - '+ data.units[i].name,
					data: baptisms,
					backgroundColor: colors,
					borderColor: colors,
					borderWidth: 1
				}]
			},
			scaleOverride: true,
			scaleSteps: 1,
			scaleStartValue: 0,
			options: {
				animation: false,
				legend: {
					display: false
				}
			}
		})
	}
	window.print();
	
});