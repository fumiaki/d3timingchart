"use strict";

var TimingChart = (function(d3) {
  var _config = {};
  var _svg, _xAxis, _yAxis, _plotPane;

  var _xScale = d3.scaleLinear();
  var _yScale = d3.scaleLinear();

  var _data = {};

  function _createConfigObject(configParam) {

    // Create default config object
    _config = {
      width: 640,
      height: 480,
      offset: {x: 0, y: 0},
      zoom:{x: 1, y: 1},

      xAxis: {
        get x() {return _config.yAxis.width},
        y: 0,
        get width() {return _config.width - _config.yAxis.width},
        height: 80
      },

      yAxis: {
        x: 0,
        get y() {return _config.xAxis.height} ,
        width: 160,
        get height() {return _config.height - _config.xAxis.height}
      },

      plotPane: {
        get x() {return _config.yAxis.width},
        get y() {return _config.xAxis.height},
        get width() {return _config.width - _config.yAxis.width},
        get height() {return _config.height - _config.xAxis.height}
      }
    };

    // Marge paramObject to default config object
    return Object.assign(_config, configParam);
  };

  function _init(configParam) {
    _createConfigObject(configParam);

    _svg = d3.select("#chart")
      .attr("width", _config.width)
      .attr("height", _config.height);


    _xAxis = _svg.select("#xAxis")
      .attr("transform", "translate(" + _config.xAxis.x + "," + _config.xAxis.y + ")");
    _xAxis.select(".background")
      .attr("width", _config.xAxis.width)
      .attr("height", _config.xAxis.height);
    _xAxis.selectAll(".tick")
      .select("line")
      .attr("y2", _config.height);

    _yAxis = _svg.select("#yAxis")
      .attr("transform", "translate(" + _config.yAxis.x + "," + _config.yAxis.y + ")");
    _yAxis.select(".background")
      .attr("width", _config.yAxis.width)
      .attr("height", _config.yAxis.height);
    _yAxis.selectAll(".tick")
      .select("line")
      .attr("x2", _config.width);

    _svg.select("#plotBackPane")
      .attr("transform", "translate(" + _config.plotPane.x + "," + _config.plotPane.y + ")")
      .select(".background")
      .attr("width", _config.plotPane.width)
      .attr("height", _config.plotPane.height);

    _plotPane = _svg.select("#plotPane")
      .attr("transform", "translate(" + _config.plotPane.x + "," + _config.plotPane.y + ")");

    // Drag operation setting
    _svg.call(d3.drag()
      .on("start", dragStarted)
      .on("drag", dragged)
      .on("end", dragEnded)
    );

    //###### TEST ########
    _xAxis.selectAll(".tick")
      .data([20, 50, 70]);

    _yAxis.selectAll(".tick")
      .data([0.1, 0.5, 0.8]);

    //####################

    _updateDisplay();
  };

  function _setData(data) {
    _data = data;
    _plotPane.selectAll("path")
      .data(_data)
      .enter().append("path")
      .classed("dragged", false);

    _updateDisplay();
  }

  function _updateDisplay() {
    _setScale();

    //#### TEST ######
    _plotPane.select("#test")
      .attr("cx", _xScale(50))
      .attr("cy", _yScale(0.5))
      .attr("r", _config.zoom.x * 40);
    _plotPane.select("#test2")
      .attr("x", _xScale(60))
      .attr("y", _yScale(0.4));

    _xAxis.selectAll("g")
      .attr("transform", function(d) {return "translate(" + _xScale(d) + ", 0)"});

    _yAxis.selectAll("g")
      .attr("transform", function(d) {return "translate(0, " + _yScale(d) + ")"});
    //###############

    _drawChart();
  };


  function _setScale() {
    _xScale
      .domain([0, 100])
      .range([
        _config.offset.x * _config.zoom.x,
        (_config.offset.x + _config.plotPane.width) * _config.zoom.x
      ]);

    _yScale
      .domain([0, 1])
      .range([
        _config.offset.y * _config.zoom.y,
        (_config.offset.y + _config.plotPane.height) * _config.zoom.y
      ]);
  }

  function _drawChart() {
    var pathString = d3.line()
      .x(function(d) {return _xScale(d.t)})
      .y(function(d) {return _yScale(d.v)});

    _plotPane.select("path")
      //.transition()
      .attr("d", function(d){return pathString(d.data)})
      .style("fill", function(d){d.color})
      //.style("marker-mid", "url('#chartMarker')")
      ;
  }

  function _zoomIn() {
    _config.zoom.x += 0.1;
    _updateDisplay();
  }

  function _zoomOut() {
    _config.zoom.x -= 0.1;
    _updateDisplay();
  }

  function _resetDisplay() {
    _config.offset = {x: 0, y: 0};
    _config.zoom = {x: 1, y: 1};
    _updateDisplay();
  }

  //var _dragStart = {x:0, y:0};
  function dragStarted(d) {
    _plotPane.select("rect").classed("dragged", true);
  };

  function dragged(d) {
    _config.offset.x += d3.event.dx / _config.zoom.x;
    _config.offset.y += d3.event.dy / _config.zoom.y;
    _updateDisplay();
  }

  function dragEnded(d) {
    _plotPane.select("rect").classed("dragged", false);
  }


  // export public method
  return {
    config: _config,
    init: _init,
    setData: _setData,
    zoomIn: _zoomIn,
    zoomOut: _zoomOut,
    resetDisplay: _resetDisplay
  };
})(d3);
