let tooltip = d3.select("body")
		      .append("div")
    		  .attr("class", "tooltip")
    		  .style("opacity", 1)
              .style("border-radius", "8px");

function parseDataFile(idPrefix, svgID, dataFile, filterTo='none', edgeDataFile='none', weightedEdges=true) {
	let nodeList = [];
	d3.csv(dataFile).then(function(data) {
		let i = 0;
		for (let nodeData of data) {
				node = {};
				if (nodeData['node number']) {
					node['id'] = idPrefix + nodeData['node number'];
				} else {
					node['id'] = idPrefix + i;
					i++;
				}
				node['long'] = nodeData['X (longitude)'];
				node['lat'] = nodeData['Y (latitude)'];

				if(nodeData['load']) {
					node['load'] = nodeData['load'];
				} else {
					node['load'] = '';
				}

				if (nodeData['Solar']) {
					node['solar'] = nodeData['Solar'];
				} else {
					node['solar'] = nodeData['solar'];
				}

				if (nodeData['Wind']) {
					node['wind'] = nodeData['Wind'];
				} else {
					node['wind'] = nodeData['wind'];
				}

				if (nodeData['Carbon free (includes biomass)']) {
					node['carbon_neutral'] = nodeData['Carbon free (includes biomass)'];
				} else {
					node['carbon_neutral'] = nodeData['carbon f&n'];
				}

				if (nodeData['Non-renewables']) {
					node['non_renewables'] = nodeData['Non-renewables'];
				} else {
					node['non_renewables'] = nodeData['nor renewables'];
				}

				if (nodeData['description']) {
					node['description'] = nodeData['description'];
				} else {
					node['description'] = '';
				}

				if (nodeData['Total generation']) {
					node['total_output'] = nodeData['Total generation'];
				} else {
					node['total_output'] = Number(node['solar']) + Number(node['wind']) + Number(node['non_renewables']) + Number(node['carbon_neutral'])
				}

				let solar = node['solar'], wind = node['wind'], cf = node['carbon_neutral'], nr = node['non_renewables'];
				if (solar > Math.max(wind, cf, nr)) {
					node['class'] = 'solar node';
				} else if (wind > Math.max(solar, cf, nr)) {
					node['class'] = 'wind node';
				} else if (cf > Math.max(solar, wind, nr)) {
					node['class'] = 'other node';
				} else {
					node['class'] = 'other node';
				}
				if (node['load'] < 0) {
					node['class'] = 'city node';
				}

				nodeList.push(node);
		}
		makeNodes(svgID, nodeList, filterTo);
		if (edgeDataFile !== 'none') {
				d3.csv(edgeDataFile).then(function(data) {
					let edgeList = [];

					for (let edgeData of data) {
						let edge = {};
						edge['id'] = idPrefix + 'Edge' + edgeData['Line number'];
						edge['from'] = idPrefix + edgeData['From node #'];
						edge['to'] = idPrefix + edgeData['To node #'];
						edge['value'] = edgeData['Value'];
						edgeList.push(edge);
					}
					makeEdges(svgID, edgeList, weightedEdges);
				});
		}
	});
}

function parseBlackoutDataFile(idPrefix, svgID, dataFile, edgeDataFile) {
	let nodeList = [];
	d3.csv(dataFile).then(function(data) {
		let i = 0;
		for (let nodeData of data) {
				node = {};
				if (nodeData['node number']) {
					node['id'] = idPrefix + nodeData['node number'];
				} else {
					node['id'] = idPrefix + i;
					i++;
				}
				node['long'] = nodeData['X (longitude)'];
				node['lat'] = nodeData['Y (latitude)'];
				nodeList.push(node);
		}

		d3.select(svgID).selectAll('.node')
	        .data(nodeList)
	        .enter().append('circle')
					.attr('id', function (d) { return d['id']})
					.attr('class', 'blackout_node')
	        .attr('cx', function (d) { return d['long']})
	        .attr('cy', function (d) { return d['lat']})
	        .attr('r', 0.02)
					.attr('stroke-width', '0.01px')
					.attr('fill-opacity', '1')
					.attr('stroke-opacity', '1');

		if (edgeDataFile !== 'none') {
				d3.csv(edgeDataFile).then(function(data) {
					let edgeList = [];

					for (let edgeData of data) {
						let edge = {};
						edge['id'] = idPrefix + 'Edge' + edgeData['Line number'];
						edge['from'] = idPrefix + edgeData['From node #'];
						edge['to'] = idPrefix + edgeData['To node #'];
						edge['class'] = 'stage1_' + edgeData['Stage 1'];
						edge['class'] += ' stage2_' + edgeData['Stage 2'];
						edge['class'] += ' stage3_' + edgeData['Stage 3'];
						edge['class'] += ' stage4_' + edgeData['Stage 4'];
						edge['class'] += ' stage5_' + edgeData['Stage 5'];
						edgeList.push(edge);
					}

					d3.select(svgID).selectAll('.edge')
								.data(edgeList)
								.enter().append('line')
								.attr('id', function (d) { return d['id']})
								.attr('class', function (d) { return d['class']})
								.attr('x1', function (d) { return $('#' + d['from']).attr('cx')})
								.attr('y1', function (d) { return $('#' + d['from']).attr('cy')})
								.attr('x2', function (d) { return $('#' + d['to']).attr('cx')})
								.attr('y2', function (d) { return $('#' + d['to']).attr('cy')})
								.attr('stroke-width', '0.01px')
								.attr('stroke', 'white');
						// Raise nodes to be drawn on top of edges.
						d3.select(svgID).selectAll('.blackout_node').raise();
				});


		}
	});
}

function makeNodes(svgID, data, filterTo) {
  	// Create a circle on the map for each node.
	  d3.select(svgID).selectAll('.node')
	        .data(data.filter(function(d) {
							if (filterTo == 'solar') {
								return d['class'].indexOf('solar') >= 0 && Number(d['total_output']) >= 0.0;
							}
	            return Number(d['total_output']) >= 0.0;
	        }))
	        .enter().append('circle')
					.attr('id', function (d) { return d['id']})
					.attr('class', function (d) { return d['class']})
	        .attr('cx', function (d) { return projection([d['long'], d['lat']])[0]})
	        .attr('cy', function (d) { return projection([d['long'], d['lat']])[1]})
	        .attr('r', function (d) { return Math.max(Math.log(d['total_output']) / 1.5, 2)})
					.attr('stroke-width', '0.8px')
					.attr('fill-opacity', '1')
					.attr('stroke-opacity', '1');
}

function makeEdges(svgID, data, weightedEdges) {
	d3.select(svgID).selectAll('.edge')
				.data(data)
				.enter().append('line')
				.attr('id', function (d) { return d['id']})
				.attr('class', function (d) {
					let r = d['value'];
					if (!weightedEdges) {
						return 'edge';
					}
					if (r >= 0.9) {
						return 'risk_90 edge';
					} else if (r >= 0.8) {
						return 'risk_80 edge';
					} else if (r >= 0.7) {
						return 'risk_70 edge';
					} else if (r >= 0.6) {
						return 'risk_60 edge';
					} else if (r >= 0.5) {
						return 'risk_50 edge';
					} else if (r >= 0.4) {
						return 'risk_40 edge';
					} else if (r >= 0.3) {
						return 'risk_30 edge';
					} else if (r >= 0.2) {
						return 'risk_20 edge';
					} else if (r >= 0.1) {
						return 'risk_10 edge';
					} else {
						return 'risk_00 edge';
					}
				})
				.attr('x1', function (d) { return $('#' + d['from']).attr('cx')})
				.attr('y1', function (d) { return $('#' + d['from']).attr('cy')})
				.attr('x2', function (d) { return $('#' + d['to']).attr('cx')})
				.attr('y2', function (d) { return $('#' + d['to']).attr('cy')})
				.attr('stroke-width', '1.5px');

		// Raise nodes to be drawn on top of edges.
		d3.select(svgID).selectAll('.node').raise();
}

function makeLegend(svgID, legendX, legendY) {
	let legend = {'Solar': {'class': 'solar'},
						'Wind': {'class': 'wind'},
						'Other Sources, Cities': {'class': 'other'}};
	let x = legendX, y = legendY
	for (let source in legend) {
		let group = d3.select(svgID).append('g')
			.attr('id', legend[source]['id'])


			group.append('rect')
				.attr('class', legend[source]['class'])
				.attr('stroke-width', 0.8)
				.attr('width', 10)
				.attr('height', 10)
				.attr('x', x)
				.attr('y', y);;

		group.append('text')
			.html(source)
			.attr('x', x + 15)
			.attr('y', y + 9)
			.attr('font-size', 10)
			.attr('font-family', 'Open Sans');
			y += 15;
	}
}
