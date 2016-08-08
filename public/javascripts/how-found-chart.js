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
			legend: {
				display: false
			},
			animation: {
				duration: 0,
				onComplete: function () {
					var ctx = this.chart.ctx;
					ctx.font = "20px "+Chart.helpers.fontString(Chart.defaults.global.defaultFontFamily, 'normal', Chart.defaults.global.defaultFontFamily);
					console.log(ctx.font);
					ctx.textAlign = 'center';
					ctx.textBaseline = 'bottom';

					this.data.datasets.forEach(function (dataset) {

					for (var i = 0; i < dataset.data.length; i++) {
						var model = dataset._meta[Object.keys(dataset._meta)[0]].data[i]._model,
							total = dataset._meta[Object.keys(dataset._meta)[0]].total,
							mid_radius = model.innerRadius + (model.outerRadius - model.innerRadius)/2,
							start_angle = model.startAngle,
							end_angle = model.endAngle,
							mid_angle = start_angle + (end_angle - start_angle)/2;

						var x = mid_radius * Math.cos(mid_angle)*1.8;
						var y = mid_radius * Math.sin(mid_angle)*1.8;

						ctx.fillStyle = '#000';
						var percent = String(Math.round(dataset.data[i]/total*100)) + "%";
						ctx.fillText(labels[i], model.x + x, model.y + y);
						// Display percent in another line, line break doesn't work for fillText
						
						ctx.fillText(percent, model.x + x, model.y + y + 15);
						console.log(i+"\t "+labels[i]);
					}
					});
				}
			}
		}
	})
	//window.print();
});