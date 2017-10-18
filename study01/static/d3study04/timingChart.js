"use strict";

var TimingChart = (function(d3) {
  var _config = {};
  var _svg, _xAxis, _yAxis, _plotPane;

  var _xScale = d3.scaleLinear();
  var _yScale = d3.scaleLinear();

  var _data = undefined;

  var _yUnit = 32;

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
        width: 240,
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
    _createSVGElement();
    _setSVGElementSize();
    _setEventHandler();

    //_updateDisplay();
  };

  function _createSVGElement() {
    _svg = d3.select("#chart");
    _xAxis = _svg.select("#xAxis");
    _yAxis = _svg.select("#yAxis");
    _plotPane = _svg.select("#plotPane");

    // create clipPath
    var defs = _svg.append("defs");
    defs.append("clipPath")
      .attr("id", "chart-clip")
      .append("rect");
    defs.append("clipPath")
      .attr("id", "xAxis-clip")
      .append("rect");
    defs.append("clipPath")
      .attr("id", "yAxis-clip")
      .append("rect");

  }

  function _setSVGElementSize() {

    _svg
      .attr("width", _config.width)
      //.attr("width", "100%")
      .attr("height", _config.height);


    _xAxis
      .attr("transform", "translate(" + _config.xAxis.x + "," + _config.xAxis.y + ")")
      .attr('clip-path', 'url(#xAxis-clip)');
    _xAxis.select(".background")
      .attr("width", _config.xAxis.width)
      .attr("height", _config.xAxis.height);
    _xAxis.selectAll(".tick line")
      .attr("y1", _config.xAxis.height)
      .attr("y2", _config.height);

    _yAxis
      .attr("transform", "translate(" + _config.yAxis.x + "," + _config.yAxis.y + ")")
      .attr('clip-path', 'url(#yAxis-clip)');
    _yAxis.select(".background")
      .attr("width", _config.yAxis.width)
      .attr("height", _config.yAxis.height);
    _yAxis.selectAll(".tick line")
      .attr("x2", _config.width);

    _svg.select("#plotBackPane")
      .attr("transform", "translate(" + _config.plotPane.x + "," + _config.plotPane.y + ")")
      .select(".background")
      .attr("width", _config.plotPane.width)
      .attr("height", _config.plotPane.height);

    _plotPane
      .attr("transform", "translate(" + _config.plotPane.x + "," + _config.plotPane.y + ")")
      .attr('clip-path', 'url(#chart-clip)');


    // clipPath
    d3.select("#chart-clip rect")
      .attr("width", _config.plotPane.width)
      .attr("height", _config.plotPane.height);
    d3.select("#xAxis-clip rect")
      .attr("width", _config.xAxis.width)
      .attr("height", _config.height);
    d3.select("#yAxis-clip rect")
      .attr("width", _config.width)
      .attr("height", _config.yAxis.height);



  };

  function _setEventHandler() {
    // Drag operation setting
    _svg.call(d3.drag()
      .on("start", dragStarted)
      .on("drag", dragged)
      .on("end", dragEnded)
    );


    // Handle window resize event
    d3.select(window)
      .on("resize", function() {
        //####TEST####
        console.log("resized!");
        var width = _svg.node().getBoundingClientRect().width;
        console.log("window.innerWidth : " + window.innerWidth);
        console.log("svg.getBoundingClientRect.width : " + _svg.node().getBoundingClientRect().width);
        //_svg.attr("width", window.innerWidth);
        //########

        _config.width = window.innerWidth;
        _config.height = window.innerHeight;

        _setSVGElementSize();
        _updateDisplay();

      });
  };


  function _setData(data) {
    _data = data;

    // Compute domain range and offset position
    var yMargin = 2;
    var yOffset = 0;

    var rangeArray = _data.map(function(elem) {
      elem.xRange = d3.extent(elem.data, function(d){return d.t});
      elem.yRange = d3.extent(elem.data, function(d){return d.v});

      yOffset = yOffset - elem.yRange[1] - yMargin;
      elem.yOffset = yOffset;

      // Add Lane Separator (Lane Label)
      var laneLabel = {v: elem.yRange[1] + 1.5, label: elem.name, type: "separator"};
      elem.yLabels.push(laneLabel);
      return {id: elem.id, x: elem.xRange, y: elem.yRange};
    });
    //console.log(rangeArray);

    _data.xRange = d3.extent(
      d3.merge(
        _data.map(function(elem) {return elem.xRange})
      )
    );
    //console.log(xRange);
    _data.yRange = [yOffset - yMargin, 0];

    _xScale
      .domain(_data.xRange);

    _yScale
      .domain(_data.yRange);

    // Preprocess data
    _data.forEach(function(d, i, a){
      _padData(d);
      _offsetData(d);
    });

    // SetUp xAxis
    var xTicks = _xAxis.selectAll(".tick");
    //xTicks.remove();
    xTicks
      .data(d3.range(_data.xRange[0], _data.xRange[1], 1))
      .enter()
      .call(function(selection) {
        // create x-tick element
        var g = selection.append("g")
          .classed("tick", true);
        g.append("line")
          .attr("y1", _config.xAxis.height)
          .attr("y2", _config.height);
        g.append("text")
          .attr("y", _config.xAxis.height - 8)
          .text(function(d){return d});
      });

    // SetUp yAxis
    var tickLabels = d3.merge(
      _data.map(function(elem) {
        return elem.yLabels;
      })
    );
    //console.log(tickLabels);

    var yTicks = _yAxis.selectAll(".tick");
    //yTicks.remove();
    yTicks
      .data(tickLabels)
      .enter()
      .call(function(selection) {
        // create y-tick element
        var g = selection.append("g");

        g.attr("class", function(d){return d.type ? "tick " + d.type : "tick"});

        g.append("line")
          .attr("x1", function(d){return d.type ? 0 : _config.yAxis.width})
          .attr("x2", _config.width);
        g.append("text")
          .attr("x", function(d){return d.type ? 8 : _config.yAxis.width - 8 })
          .attr("dy", function(d){return d.type ? "1em" : "0.4em"})
          .text(function(d){return d.label});
      });

    // Setup chart Path
    _plotPane.selectAll("path")
      .data(_data)
      .enter()
      .append("path");

    _updateDisplay();
  }

  // チャートの前後に予備データ追加（塗りつぶしの始点をY=0に合わせるため
  function _padData(laneData) {
    var data = laneData.data;
    data.unshift({t:d3.min(data, function(d){return d.t}), v:0});
    data.push({t:d3.max(data, function(d){return d.t}), v:0});
  }

  // 複数のチャートを縦に並べるため、チャート毎にY軸の値をOffsetする
  function _offsetData(laneData) {
    laneData.data.forEach(function(d, i, a){d.v += laneData.yOffset});
    laneData.yLabels.forEach(function(d, i, a){d.v += laneData.yOffset});
  }

  function _updateDisplay() {
    _setScale();

    //#### TEST ######
    _plotPane.select("#test")
      .attr("cx", _xScale(10))
      .attr("cy", _yScale(3))
      .attr("r", _config.zoom.x * _yUnit);
    _plotPane.select("#test2")
      .attr("x", _xScale(12))
      .attr("y", _yScale(5));

    _xAxis.selectAll("g")
      .attr("transform", function(d) {return "translate(" + _xScale(d) + ", 0)"});

    _yAxis.selectAll("g")
      .attr("transform", function(d) {return "translate(0, " + _yScale(d.v) + ")"});
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
        //(_config.offset.y + _config.plotPane.height) * _config.zoom.y,
        (_config.offset.y - _data.yRange[0]) * _config.zoom.y * _yUnit,
        _config.offset.y * _config.zoom.y * _yUnit
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
    _config.offset.y += d3.event.dy / _config.zoom.y / _yUnit;
    _updateDisplay();
  }

  function dragEnded(d) {
    _plotPane.select("rect").classed("dragged", false);
  }

  // ######### Utility method ########


  // ######## export public method ########
  return {
    config: _config,
    init: _init,
    setData: _setData,
    zoomIn: _zoomIn,
    zoomOut: _zoomOut,
    resetDisplay: _resetDisplay
  };
})(d3);
