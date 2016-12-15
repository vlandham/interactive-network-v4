
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

  //
  var svg = null;
  var nodes = null;
  var edges = null;
  var allData = {};
  var linkedByIndex = {};
  var showEdges = true;

  //
  var colorScheme = d3.scaleOrdinal(d3.schemeCategory20);

  // tooltip for mouseover functionality
  var tooltip = floatingTooltip('network-tooltip', 220);

  // Charge is negative because we want nodes to repel.
  // @v4 Before the charge was a stand-alone attribute
  //  of the force layout. Now we can use it as a separate force!
  /*
  *
  */
  function charge(d) {
    return -Math.pow(d.radius, 2.0) * 0.04;
  }

  /*
  *
  */
  function ticked() {
    nodes
      .attr('cx', function (d) { return d.x; })
      .attr('cy', function (d) { return d.y; });

    if (showEdges) {
      edges
        .attr('x1', function (d) { return d.source.x; })
        .attr('y1', function (d) { return d.source.y; })
        .attr('x2', function (d) { return d.target.x; })
        .attr('y2', function (d) { return d.target.y; });
    } else {
      edges
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', 0)
        .attr('y2', 0);
    }
  }

  function ended() {
    showEdges = true;
    ticked();
  }

  // Here we create a force layout and
  // @v4 We create a force simulation now and
  //  add forces to it.
  var simulation = d3.forceSimulation()
    .velocityDecay(0.2)
    .alphaMin(0.1)
    .on('tick', ticked)
    .on('end', ended);


  //
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
      .attr('class', 'edges');

    svg.append('g')
      .attr('class', 'nodes');

    render();
  };

  /*
  *
  */
  function render() {
    // filter data to show based on current filter settings.
    var newNodes = filterNodes(allData.nodes);
    var newEdges = filterEdges(allData.links, newNodes);

    simulation.nodes(newNodes);
    var artists = sortArtists(newNodes, newEdges);


    if (layout === 'force') {
      setupNetworkLayout(newEdges);
    } else {
      setupRadialLayout(artists);
    }

    renderNodes(newNodes);
    renderEdges(newEdges);

    //
    simulation.alpha(1).restart();
  }

  /*
  *
  */
  function setupNetworkLayout(edgesData) {
    var linkForce = d3.forceLink()
      .distance(50)
      .strength(1)
      .links(edgesData);

    simulation.force('links', linkForce);
    simulation.force('center', d3.forceCenter(width / 2, (height / 2) - 160));

    simulation.force('charge', d3.forceManyBody());
    simulation.force('x', null);
    simulation.force('y', null);
  }

  /*
  *
  */
  function setupRadialLayout(artists) {
    showEdges = false;
    simulation.force('center', null);
    var groupCenters = radialLayout()
      .center({ x: width / 2, y: (height / 2) })
      .radius(200)
      .increment(18)
      .keys(artists);

    simulation.force('links', null);
    simulation.force('charge', d3.forceManyBody().strength(charge));

    var xForce = d3.forceX()
      .strength(0.02)
      .x(function (d) { return groupCenters(d.artist).x; });

    var yForce = d3.forceY()
      .strength(0.02)
      .y(function (d) { return groupCenters(d.artist).y; });

    simulation.force('x', xForce);
    simulation.force('y', yForce);
  }

  /*
  *
  */
  function filterNodes(nodesData) {
    var newNodesData = nodesData;
    if (filter === 'popular' || filter === 'obscure') {
      var playcounts = nodesData.map(function (d) { return d.playcount; });
      playcounts = playcounts.sort(d3.ascending);
      var cutoff = d3.quantile(playcounts, 0.5);
      newNodesData = nodesData.filter(function (d) {
        if (filter === 'popular') {
          return d.playcount > cutoff;
        }
        return d.playcount <= cutoff;
      });
    }

    return newNodesData;
  }

  function filterEdges(edgesData, nodesData) {
    if (!showEdges) {
      return [];
    }
    var nodesMap = d3.map(nodesData, function (d) { return d.id; });

    var newEdgesData = edgesData.filter(function (d) {
      return nodesMap.get(d.source.id) && nodesMap.get(d.target.id);
    });

    return newEdgesData;
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
      .style('stroke', 'white')
      // .style('stroke', function (d) { return strokeFor(d); })
      .style('stroke-width', 1.0);
  }

  function renderEdges(edgesData) {
    edges = svg.select('.edges').selectAll('.edge')
      .data(edgesData, function (d) { return d.id; });

    var edgesE = edges.enter().append('line')
      .classed('edge', true)
      .attr('stroke', '#ddd')
      .attr('stroke-opacity', 0.8);

    edges.exit().remove();

    edges = edges.merge(edgesE);
  }

  function setupData(data) {
    // initialize circle radius scale
    var countExtent = d3.extent(data.nodes, function (d) { return d.playcount; });
    var radiusScale = d3.scalePow()
      .exponent(0.5)
      .range([3, 12])
      .domain(countExtent);

    data.nodes.forEach(function (n) {
      // add radius to the node so we can use it later
      n.radius = radiusScale(n.playcount);
    });

    var nodesMap = d3.map(data.nodes, function (d) { return d.id; });

    // switch links to point to node objects instead of id's
    data.links.forEach(function (l) {
      l.source = nodesMap.get(l.source);
      l.target = nodesMap.get(l.target);
      l.id = l.source.id + '_' + l.target.id;

      // linkedByIndex is used for link sorting
      linkedByIndex[l.id] = 1;
    });

    return data;
  }

  function sortArtists(nodesData, edgesData) {
    var artists = [];
    var counts = {};
    if (sort === 'links') {
      edgesData.forEach(function (e) {
        counts[e.source.artist] = counts[e.source.artist] ? counts[e.source.artist] : 0;
        counts[e.source.artist] += 1;
        counts[e.target.artist] = counts[e.target.artist] ? counts[e.target.artist] : 0;
        counts[e.source.artist] += 1;

        nodesData.forEach(function (n) {
          counts[n.artist] = counts[n.artist] ? counts[n.artist] : 0;
        });

        artists = d3.entries(counts).sort(function (a, b) { return b.value - a.value; });
        artists = artists.map(function (a) { return a.key; });
      });
    } else {
      nodesData.forEach(function (n) {
        counts[n.artist] = counts[n.artist] ? counts[n.artist] : 0;
        counts[n.artist] += 1;
        artists = d3.entries(counts).sort(function (a, b) { return b.value - a.value; });
        artists = artists.map(function (a) { return a.key; });
      });
    }


    return artists;
  }


  /*
  *
  */
  chart.updateLayout = function (newLayout) {
    simulation.stop();
    layout = newLayout;
    render();
    return this;
  };

  /*
  *
  */
  chart.updateFilter = function (newFilter) {
    filter = newFilter;
    render();
    return this;
  };

  /*
  *
  */
  chart.updateSort = function (newSort) {
    sort = newSort;
    render();
    return this;
  };

  /*
  *
  */
  chart.updateData = function (newData) {
    allData = setupData(newData);
    render();
  };

  /*
  *
  */
  chart.updateSearch = function (searchTerm) {
    var searchRegEx = new RegExp(searchTerm.toLowerCase());
    nodes.each(function (d) {
      var element = d3.select(this);
      var match = d.name.toLowerCase().search(searchRegEx);
      if (searchTerm.length > 0 && match >= 0) {
        element.style('fill', '#F38630')
          .style('stroke-width', 2.0)
          .style('stroke', '#555');
        d.searched = true;
      } else {
        d.searched = false;
        element.style('fill', function (e) { return colorScheme(e.artist); })
          .style('stroke-width', 1.0);
      }
    });
  };

  /*
  *
  */
  function highlightNode(d, i) {
    var content = '<p class="main">' + d.name + '</span></p>';
    content += '<hr class="tooltip-hr">';
    content += '<p class="main">' + d.artist + '</span></p>';
    tooltip.showTooltip(content, d3.event);

    if (showEdges) {
      edges
        .attr('stroke', function (l) {
          if (l.source.id === d.id || l.target.id === d.id) {
            return '#555';
          }
          return '#ddd';
        })
        .attr('stroke-opacity', function (l) {
          if (l.source.id === d.id || l.target.id === d.id) {
            return 1.0;
          }
          return 0.5;
        });
    }
  }

  /*
  *
  */
  function unhighlightNode(d, i) {
    tooltip.hideTooltip();

    edges
      .attr('stroke', '#ddd')
      .attr('stroke-opacity', 0.8);
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
