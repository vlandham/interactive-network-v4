
/*
 * network
 */
function network() {
  // Constants for sizing
  var width = 960;
  var height = 800;

  // variables to refect the current settings
  // of the visualization
  var layout = 'force';
  var filter = 'all';
  var sort = 'songs';

  // @v4 strength to apply to the position forces
  var forceStrength = 0.03;

  //
  var svg = null;
  var nodes = null;
  var edges = null;
  var allData = {};
  var linkedByIndex = {};

  //
  var colorScheme = d3.scaleOrdinal(d3.schemeCategory20);

  // tooltip for mouseover functionality
  var tooltip = floatingTooltip('network-tooltip', 220);

  // Charge is negative because we want nodes to repel.
  // @v4 Before the charge was a stand-alone attribute
  //  of the force layout. Now we can use it as a separate force!
  function charge(d) {
    return -Math.pow(d.radius, 2.0) * forceStrength;
  }

  function ticked() {
    nodes
      .attr('cx', function (d) { return d.x; })
      .attr('cy', function (d) { return d.y; });
  }

  // Here we create a force layout and
  // @v4 We create a force simulation now and
  //  add forces to it.
  var simulation = d3.forceSimulation()
    .velocityDecay(0.2)
    .force('center', d3.forceCenter(width / 2, height / 2))
    // .force('y', d3.forceY().strength(forceStrength).y(center.y))
    .force('charge', d3.forceManyBody().strength(charge))
    .on('tick', ticked);

  simulation.stop();

  /*
  * Main entry point to the
  */
  var chart = function (selector, rawData) {
    allData = setupData(rawData);

    // Create a SVG element inside the provided selector
    // with desired size.
    svg = d3.select(selector)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    svg.append('g')
      .attr('class', 'nodes');

    svg.append('g')
      .attr('class', 'edges');

    render();
  };

  function render() {
    // filter data to show based on current filter settings.
    var newNodes = filterNodes(allData.nodes);
    var newEdges = filterEdges(allData.edges, newNodes);

    renderNodes(newNodes);
    renderEdges(newEdges);

    simulation.nodes(newNodes);

    simulation.alpha(1).restart();
  }

  function filterNodes(nodesData) {
    return nodesData;
  }

  function filterEdges(edgesData, nodesData) {
    return edgesData;
  }

  function renderNodes(nodesData) {
    nodes = svg.select('.nodes').selectAll('.node')
      .data(nodesData);

    var nodesE = nodes.enter().append('circle')
      .classed('node', true)
      .attr('cx', function (d) { return d.x; })
      .attr('cy', function (d) { return d.y; })
      .on('mouseover', highlightNode)
      .on('mouseout', unhighlightNode);

    nodes.exit().remove();

    nodes = nodes.merge(nodesE)
      .attr('r', function (d) { return d.radius; })
      .style('fill', function (d) { return colorScheme(d.artist); })
      // .style('stroke', function (d) { return strokeFor(d); })
      .style('stroke-width', 1.0);
  }

  function renderEdges(edgesData) {

  }

  function setupData(data) {
    // initialize circle radius scale
    var countExtent = d3.extent(data.nodes, function (d) { return d.playcount; });
    var radiusScale = d3.scalePow()
      .exponent(0.5)
      .range([3, 12])
      .domain(countExtent);

    data.nodes.forEach(function (n) {
      // set initial x/y to values within the width/height
      //  of the visualization
      // n.x = randomnumber = Math.floor(Math.random()*width)
      // n.y = randomnumber=Math.floor(Math.random()*height)
      // add radius to the node so we can use it later
      n.radius = radiusScale(n.playcount);
    });

    // id's -> node objects
    var nodesMap = mapNodes(data.nodes);

    // switch links to point to node objects instead of id's
    data.links.forEach(function (l) {
      l.source = nodesMap.get(l.source);
      l.target = nodesMap.get(l.target);

      // linkedByIndex is used for link sorting
      var edgeId = l.source.id + ',' + l.target.id;
      linkedByIndex[edgeId] = 1;
    });

    return data;
  }

  // Helper function to map node id's to node objects.
  // Returns d3.map of ids -> nodes
  function mapNodes(nodesData) {
    var nodesMap = d3.map();
    nodesData.forEach(function (n) {
      nodesMap.set(n.id, n);
    });
    return nodesMap;
  }

  chart.updateLayout = function (newLayout) {
    return this;
  };

  chart.updateFilter = function (newFilter) {
    return this;
  };

  chart.updateSort = function (newSort) {
    return this;
  };

  chart.updateData = function (newData) {
    allData = setupData(newData);
    render();
  };

  function highlightNode(d, i) {
    var content = '<p class="main">' + d.name + '</span></p>';
    content += '<hr class="tooltip-hr">';
    content += '<p class="main">' + d.artist + '</span></p>';
    tooltip.showTooltip(content, d3.event);
  }

  function unhighlightNode(d, i) {
    tooltip.hideTooltip();
  }


  return chart;
}


/*
 * Below is the initialization code as well as some helper functions
 * to create a new network instance, load the data, and display it.
 */

var myNetwork = network();


/*
 * Function called once data is loaded from CSV.
 * Calls bubble chart function to display inside #vis div.
 */
function display(error, data) {
  if (error) {
    console.log(error);
  }

  myNetwork('#vis', data);
}

// Load the data.
d3.json('data/call_me_al.json', display);

// Activate selector button
function activate(group, link) {
  d3.selectAll('#' + group + ' a')
    .classed('active', false);
  d3.select('#' + group + ' #' + link)
    .classed('active', true);
}


/*
 *
 */
function setupMenu() {
  d3.selectAll('#layouts a').on('click', function () {
    var newLayout = d3.select(this).attr('id');
    activate('layouts', newLayout);
    myNetwork.updateLayout(newLayout);
  });

  d3.selectAll('#filters a').on('click', function () {
    var newFilter = d3.select(this).attr('id');
    activate('filters', newFilter);
    myNetwork.updateFilter(newFilter);
  });

  d3.selectAll('#sorts a').on('click', function () {
    var newSort = d3.select(this).attr('id');
    activate('sorts', newSort);
    myNetwork.updateSort(newSort);
  });

  d3.select('#song_select').on('change', function () {
    var songFile = d3.select(this).property('value');
    d3.json('data/' + songFile, function (json) {
      myNetwork.updateData(json);
    });
  });

  d3.select('#search').on('keyup', function () {
    var searchTerm = d3.select(this).property('value');
    myNetwork.updateSearch(searchTerm);
  });
}

setupMenu();
