
function radialLayout() {
  var values = d3.map();
  var increment = 20;
  var radius = 200;
  var center = { x: 0, y: 0 };
  var start = -120;
  var current = start;

  function radialLocation(center, angle, radius) {
    var x;
    var y;
    x = center.x + radius * Math.cos(angle * Math.PI / 180);
    y = center.y + radius * Math.sin(angle * Math.PI / 180);
    return { x: x, y: y };
  };

  function placement(key) {
    var value;
    value = values.get(key);
    if (!values.has(key)) {
      value = place(key);
    }
    return value;
  };

  function place(key) {
    var value;
    value = radialLocation(center, current, radius);
    values.set(key, value);
    current += increment;
    return value;
  };

  function setKeys(keys) {
    values = d3.map();
    var firstCircleCount = 360 / increment;
    if (keys.length < firstCircleCount) {
      increment = 360 / keys.length;
    }
    var firstCircleKeys = keys.slice(0, firstCircleCount);
    firstCircleKeys.forEach(function (k) {
      return place(k);
    });
    var secondCircleKeys = keys.slice(firstCircleCount);
    radius = radius + radius / 1.8;
    increment = 360 / secondCircleKeys.length;
    return secondCircleKeys.forEach(function (k) {
      return place(k);
    });
  };
  placement.keys = function (_) {
    if (!arguments.length) {
      return d3.keys(values);
    }
    setKeys(_);
    return placement;
  };
  placement.center = function (_) {
    if (!arguments.length) {
      return center;
    }
    center = _;
    return placement;
  };

  placement.radius = function (_) {
    if (!arguments.length) {
      return radius;
    }
    radius = _;
    return placement;
  };

  placement.start = function (_) {
    if (!arguments.length) {
      return start;
    }
    start = _;
    current = start;
    return placement;
  };

  placement.increment = function (_) {
    if (!arguments.length) {
      return increment;
    }
    increment = _;
    return placement;
  };

  return placement;
};
