// Main module
var ChartView = (function(d3) {
  var _editMode = "move";
  //var _editMode = "link";
  //var _chartModel;

  var _config = {};
  var _svg, _xAxis, _yAxis, _plotPane, _backPane;

  var _xScale = d3.scaleLinear();
  var _yScale = d3.scaleLinear();

  var _model = undefined;

  var _yUnit = 32;


  function _init(configParam) {
    _createConfigObject(configParam);
    _createSVGElement();
    _setSVGElementSize();
    _setEventHandler();

    //_updateDisplay();
  };

  function _createConfigObject(configParam) {
    // Create default config object
    _config = {
      width: 800,
      height: 640,
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

    configParam.xAxis = Object.assign(_config.xAxis, configParam.xAxis);
    configParam.yAxis = Object.assign(_config.yAxis, configParam.yAxis);
    configParam.plotPane = Object.assign(_config.plotPane, configParam.plotPane);
    // Marge paramObject to default config object
    return Object.assign(_config, configParam);
  };


  function _createSVGElement() {
    _svg = d3.select("#chart");
    _xAxis = _svg.select("#xAxis");
    _yAxis = _svg.select("#yAxis");
    _plotPane = _svg.select("#plotPane");
    _backPane = _svg.select("#backPane")

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
    _xAxis.selectAll(".tick line")
      .attr("y1", _config.xAxis.height)
      .attr("y2", _config.height);

    _yAxis
      .attr("transform", "translate(" + _config.yAxis.x + "," + _config.yAxis.y + ")")
      .attr('clip-path', 'url(#yAxis-clip)');
    _yAxis.selectAll(".tick line")
      .attr("x2", _config.width);

    _backPane.select(".chart")
      .attr("transform", "translate(" + _config.plotPane.x + "," + _config.plotPane.y + ")")
      .attr("width", _config.plotPane.width)
      .attr("height", _config.plotPane.height);
    _backPane.select(".x")
      .attr("transform", "translate(" + _config.xAxis.x + "," + _config.xAxis.y + ")")
      .attr("width", _config.xAxis.width)
      .attr("height", _config.xAxis.height);
    _backPane.select(".y")
      .attr("transform", "translate(" + _config.yAxis.x + "," + _config.yAxis.y + ")")
      .attr("width", _config.yAxis.width)
      .attr("height", _config.yAxis.height);

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
        //_updateDisplay();

      });
  };
  function dragStarted(d) {
    _svg.select("#plotBackPane rect").classed("dragged", true);
  };

  function dragged(d) {
    _config.offset.x += d3.event.dx;
    _config.offset.y += d3.event.dy;

      _scroll();
  }

  function dragEnded(d) {
    _svg.select("#plotBackPane rect").classed("dragged", false);
  }

  function _scroll() {
    _plotPane
      .attr("transform", "translate(" + (_config.plotPane.x + _config.offset.x) + "," + (_config.plotPane.y + _config.offset.y) + ")");
    _svg.select("#chart-clip rect")
      .attr("x", -_config.offset.x)
      .attr("y", -_config.offset.y);

    _xAxis
      .attr("transform", "translate(" + (_config.xAxis.x + _config.offset.x) + ", 0)");
    _svg.select("#xAxis-clip rect")
      .attr("x", -_config.offset.x);

    _yAxis
      .attr("transform", "translate(0, " + (_config.yAxis.y + _config.offset.y) + ")");
    _svg.select("#yAxis-clip rect")
      .attr("y", -_config.offset.y);
  }

  function _setData(chartModel) {
    _model = chartModel;

    // Compute domain range and offset position
    var yMargin = 2;
    var yOffset = 0;

    var rangeArray = Array.from(_model.lanes.values()).map(function(lane) {
      lane.xRange = d3.extent(lane.nodes, function(d){return d.t});
      lane.yRange = d3.extent(lane.stateLabels, function(d){return d.v});

      yOffset = yOffset - lane.yRange[1] - yMargin;
      lane.yOffset = yOffset;

      // Add Lane Separator (Lane Label)
      var laneLabel = {v: lane.yRange[1] + 1.5, label: lane.name, type: "separator"};
      lane.stateLabels.push(laneLabel);
      return {id: lane.id, x: lane.xRange, y: lane.yRange};
    });
    //console.log(rangeArray);

    _model.xRange = d3.extent(
      d3.merge(
        Array.from(_model.lanes.values()).map(function(lane) {return lane.xRange})
      )
    );
    //console.log(xRange);
    _model.yRange = [yOffset - yMargin, 0];

    _xScale
      .domain(_model.xRange);

    _yScale
      .domain(_model.yRange);

    // Preprocess data
    Array.from(_model.lanes.values()).forEach(function(d, i, a){
      //_padData(d);
      _offsetData(d);
    });

    // SetUp xAxis
    var xTicks = _xAxis.selectAll(".tick");
    //xTicks.remove();
    xTicks
      .data(d3.range(_model.xRange[0], _model.xRange[1], 50))
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
      Array.from(_model.lanes.values()).map(function(lane) {
        return lane.stateLabels;
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
          .attr("dy", function(d){return d.type ? "1em" : "0.35em"})
          .text(function(d){return d.label});
      });

    // Setup chart Path
    _setScale();
    _updateAxis();
    _createView();

    //_updateDisplay();
  }

  // チャートの前後に予備データ追加（塗りつぶしの始点をY=0に合わせるため
  function _padData(laneData) {
    var nodes = laneData.nodes;
    nodes.unshift({t:d3.min(nodes, function(d){return d.t}), _initialState:0, endState:0, duration:0});
    nodes.push({t:d3.max(nodes, function(d){return d.t}), _initialState:0, endState:0, duration:0});
  }

  // 複数のチャートを縦に並べるため、チャート毎にY軸の値をOffsetする
  function _offsetData(laneData) {
    /*
    laneData.nodes.forEach(function(node, i, a){
      node._initialState += laneData.yOffset;
      node.endState += laneData.yOffset;
    });
    */
    laneData.stateLabels.forEach(function(label, i, a){label.v += laneData.yOffset});
  }

  function _setScale() {
    _xScale
      .range([
        0,
        _config.plotPane.width * _config.zoom.x
      ]);

    _yScale
      .range([
        (-_model.yRange[0]) * _config.zoom.y * _yUnit,
        0
      ]);
  }

  function _updateAxis() {
    _xAxis.selectAll("g")
      .attr("transform", function(d) {return "translate(" + _xScale(d) + ", 0)"});

    _yAxis.selectAll("g")
      .attr("transform", function(d) {return "translate(0, " + _yScale(d.v) + ")"});
  };

  function _updateDisplay() {
    _setScale();
    _updateAxis();
    _scroll();

    _plotPane.selectAll(".lane")
      .call(_updateLaneNode);

    _plotPane.selectAll(".event")
      .call(_updateEventNode);

    _plotPane.selectAll(".link")
      .call(_updateLinkNode);

  };


  function _createView() {
    console.log("_createView");
    console.log(_model);

    _plotPane.selectAll(".lane")
      .data(Array.from(_model.lanes.values()))
      .enter()
      .call(_createLaneNode);

    _plotPane.selectAll(".event")
      .data(Array.from(_model.nodes.values()))
      .enter()
      .call(_createEventNode);

    _plotPane.selectAll(".link")
      .data(Array.from(_model.links.values()))
      .enter()
      .call(_createLinkNode);
  };

  function _createLaneNode(selection) {
    selection
      .append("g")
      .classed("lane", true)
      .attr("id", function(d) {return d.id})
      .call(_createLaneVisual)
      .call(_updateLaneNode);
  };

  function _createLaneVisual(s) {
    s.append("path")
      .classed("vis", true);
    s.append("rect")
      .classed("handle", true);
  };
  function _updateLaneNode(s) {
    s.select("path")
      .style("fill", function(lane){return lane.color})
      .attr("d", function(lane) {
        var pathStr = "M0," + _yScale(lane.yOffset)
          + " v" + _yScale(lane.nodes[0]._initialState);
        lane.nodes.forEach(function(node) {
          //console.log(d)
          pathStr
            += " L" + _xScale(node.t) + "," + _yScale(lane.yOffset + node._initialState)
            + " l" + _xScale(node.duration) + "," + _yScale(node.endState - node._initialState);
        });
        pathStr += " H" + _xScale(_model.xRange[1])
          + " V" + _yScale(lane.yOffset);
        //console.log(pathStr);
        return pathStr;
      });

      s.select("rect")
        .attr("x", function(lane){return 0 - 4})
        .attr("y", function(lane){return _yScale(d3.max(lane.stateLabels, function(label){return label.v})) - 4})
        .attr("width", function(lane){return _xScale(_model.xRange[1]) + 8})
        .attr("height", function(lane){return _yScale(d3.min(lane.stateLabels, function(label){return label.v}) - d3.max(lane.stateLabels, function(label){return label.v})) + 4})
        .on("click", function(lane) {
          d3.select(this).classed("selected", true);
          _model.createNode({lane: lane});
          _createView();
          console.log(_model);
        })
        .on("mouseout", function(d) {
          d3.select(this).classed("selected", false)
        })
  };

  function _createEventNode(selection) {
    selection
      .append("g")
      .attr("id", function(d) {return d.id})
      .classed("event", true)
      .call(_createEventVisual)
      .call(_updateEventNode);
  };

  function _createEventVisual(s) {
    //s.append("path").classed("vis", true);
    s.append("rect")
      .classed("bodyHandle", true)
      .on("contextmenu", (d, i) => {
        d3.event.preventDefault();
        console.log(d)})
      .call(d3.drag()
        .on("start", function(d) {
          d3.select(this).classed("dragged", true);
        })
        .on("drag", function(d) {
          if (_editMode == "move") {
            d.t += _xScale.invert(d3.event.dx);
            d3.select(this.parentNode).call(_updateEventNode)

            d3.select("#plotPane").selectAll(".link")
              .call(_updateLinkNode);
            d3.select("#" + d.lane.id)
              .call(_updateLaneNode);

          } else if(_editMode == "link") {

          }

          d3.select("#console1").text(JSON.stringify(d, function(k,v){if(k=="lane") {return {}} else {return v}}));
          //d3.select("#console2").text(JSON.stringify(d3.event));
          d3.select("#console3").text(d3.mouse(this));
        })
        .on("end", function(d) {
          d3.select(this).classed("dragged", false);

          if(_editMode == "link") {
            var dropTo = d3.select("#plotPane").select(".event:hover");
            var newLink = _model.createLink({
              name: "New Link",
              from: d3.select(this).datum().id,
              to: dropTo.datum().id
            });

            d3.select("#plotPane").selectAll(".link")
              .data(Array.from(_model.links.values()))
              .enter()
              .call(_createLinkNode);
          }

        })
      );
    s.append("rect")
      .classed("resizeHandle", true)
      .call(d3.drag()
        .on("start", function(d) {
          d3.select(this).classed("dragged", true);
        })
        .on("drag", function(d) {
          d.duration = d.duration + _xScale.invert(d3.event.dx);
          d.duration = Math.max(d.duration, 0);
          d3.select(this.parentNode).call(_updateEventNode)

          d3.select("#plotPane").selectAll(".link")
            .call(_updateLinkNode);
          d3.select("#" + d.lane.id)
            .call(_updateLaneNode);

          d3.select("#console1").text(JSON.stringify(d, function(k,v){if(k=="lane") {return {}} else {return v}}));
          //d3.select("#console2").text(JSON.stringify(d3.event));
          d3.select("#console3").text(d3.mouse(this));
        })
        .on("end", function(d) {
          d3.select(this).classed("dragged", false);
        })
      );
  };

  function _updateEventNode(s) {
    s.select(".bodyHandle")
      /*
      .attr("d", function(d) {
        var pathStr
          = "M" + (_xScale(d.t) - 4) + "," + (_yScale(d.lane.yOffset + d._initialState) - 4)
          + "l" + _xScale(d.duration) + "," + 0
        ;
        console.log(pathStr);
        return pathStr;
      });
      */
      .attr("x", function(d){return _xScale(d.t) - 4})
      .attr("y", function(d){return _yScale(d.lane.yOffset + Math.max(d._initialState, d.endState)) - 4})
      .attr("width", function(d){return _xScale(d.duration) + 8})
      .attr("height", function(d){return Math.abs(_yScale(d.endState - d._initialState)) + 8});
    s.select(".resizeHandle")
      .attr("x", function(d){return _xScale(d.t + d.duration) + 4})
      .attr("y", function(d){return _yScale(d.lane.yOffset + Math.max(d._initialState, d.endState)) - 4})
      .attr("width", function(d){return 16})
      .attr("height", function(d){return Math.abs(_yScale(d.endState - d._initialState)) + 8});
  };

  function _createLinkNode(selection) {
    selection
      .append("g")
      .classed("link", true)
      .call(_createLinkVisual)
      .call(_updateLinkNode);
  };

  function _createLinkVisual(s) {
    s.append("rect")
      .classed("bodyHandle", true)
      .call(d3.drag()
        .on("start", function(d) {
          d3.select(this).classed("dragged", true);
        })
        .on("drag", function(d) {
          d.x += d3.event.dx;
          d3.select(this.parentNode).call(_updateLinkNode)
        })
        .on("end", function(d) {
          d3.select(this).classed("dragged", false);
        })
      );
    s.append("path").classed("vis", true);
  };

  function _updateLinkNode(s) {
    /*
    s.select("rect.bodyHandle")
      .attr("x", function(d){return d.fromNode.x - 4})
      .attr("y", function(d){return d.fromNode.y - 4})
      .attr("width", function(d){return Math.abs(d.toNode.x - d.fromNode.x) + 8})
      .attr("height", function(d){return Math.abs(d.toNode.y - d.fromNode.y)*50 + 8});
    */
    s.select("path")
      .attr("d", function(d){
        var pathString
          = "M" + _xScale(d.fromNode.t + d.fromNode.duration) + "," + _yScale(d.fromNode.lane.yOffset + d.fromNode.endState)
          + " L" + _xScale(d.toNode.t) + "," + _yScale(d.toNode.lane.yOffset + d.toNode._initialState) ;
        return pathString;
      })
  };



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


  function _changeEditMode(modeString) {
    _editMode = modeString;

    if(_editMode =="newEvent") {
      d3.selectAll(".event")
        .classed("hide", true);
      d3.selectAll(".lane .handle")
        .classed("hide", false);
    } else {
      d3.selectAll(".event")
        .classed("hide", false);
      d3.selectAll(".lane .handle")
        .classed("hide", true);
    }
  }

  return {
    init: _init,
    setData: _setData,
    createView: _createView,
    changeEditMode: _changeEditMode,
    zoomIn: _zoomIn,
    zoomOut: _zoomOut,
    resetDisplay: _resetDisplay
  };

}(d3));
