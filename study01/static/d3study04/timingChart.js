"use strict";

var TimingChart = (function(d3) {
  var _config = {};
  var _svg, _xAxis, _yAxis, _plotPane;

  var _xScale = d3.scaleLinear();
  var _yScale = d3.scaleLinear();

  var _data = undefined;

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
      .data([1, 5, 10]);

    _yAxis.selectAll(".tick")
      .data([1, 2, 3]);

    //####################

    _updateDisplay();
  };

  function _setData(data) {
    _data = data;
    _data.forEach(function(v, i, a){
      _padData(v.data);
      _offsetData(v.data, v.yOffset)
    });

    _plotPane.selectAll("path")
      .data(_data)
      .enter().append("path");

      if(!_data) {
        return;
      }

      var maxArray = _data.map(function(elem) {
        return d3.max(elem.data, function(d){return d.v});
        //return Math.max.apply(null, elem.data.map(function(elm2) {
        //  return elm2.v;
        //}));
      });
      console.log(maxArray);


    _xScale
      .domain([0, 13]);

    _yScale
      .domain([0, 10]);

    _updateDisplay();
  }

  // チャートの前後に予備データ追加（塗りつぶしの始点をY=0に合わせるため
  function _padData(data) {
    data.unshift({t:d3.min(data, function(d){return d.t}), v:0});
    data.push({t:d3.max(data, function(d){return d.t}), v:0});
  }

  // 複数のチャートを縦に並べるため、チャート毎にY軸の値をOffsetする
  function _offsetData(data, offset) {
    data.forEach(function(v, i, a){v.v += offset});
  }

  function _updateDisplay() {
    _setScale();

    //#### TEST ######
    _plotPane.select("#test")
      .attr("cx", _xScale(10))
      .attr("cy", _yScale(3))
      .attr("r", _config.zoom.x * 40);
    _plotPane.select("#test2")
      .attr("x", _xScale(12))
      .attr("y", _yScale(5));

    _xAxis.selectAll("g")
      .attr("transform", function(d) {return "translate(" + _xScale(d) + ", 0)"});

    _yAxis.selectAll("g")
      .attr("transform", function(d) {return "translate(0, " + _yScale(d) + ")"});
    //###############

    _drawChart();
  };


  function _setScale() {
    _xScale
      .range([
        _config.offset.x * _config.zoom.x,
        (_config.offset.x + _config.plotPane.width) * _config.zoom.x
      ]);

    _yScale
      .range([
        (_config.offset.y + _config.plotPane.height) * _config.zoom.y,
        _config.offset.y * _config.zoom.y
      ]);
  }

  function _drawChart() {
    var pathString = d3.line()
      .x(function(d) {return _xScale(d.t)})
      .y(function(d) {return _yScale(d.v)});

    _plotPane.selectAll("path")
      //.transition()
      .attr("d", function(d){return pathString(d.data)})
      .style("fill", function(d){return d.color})
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
