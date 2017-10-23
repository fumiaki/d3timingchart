// Main module
var ChartView = (function(d3) {
  //var _editMode = "move";
  var _editMode = "link";
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

  function _setData(data) {
    _model = data;

    // Compute domain range and offset position
    var yMargin = 2;
    var yOffset = 0;

    var rangeArray = _data.lanes.map(function(elem) {
      elem.xRange = d3.extent(elem.data, function(d){return d.t});
      elem.yRange = d3.extent(elem.stateLabels, function(d){return d.v});

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
          .attr("dy", function(d){return d.type ? "1em" : "0.35em"})
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



  function _createView(chartModel) {
    _model = chartModel;

    console.log("_createView");
    console.log(_model);

    _plotPane.selectAll(".lane")
      .data(Array.from(chartModel.lanes.values()))
      .enter()
      .call(_createLaneNode);

    _plotPane.selectAll(".event")
      .data(Array.from(chartModel.nodes.values()))
      .enter()
      .call(_createEventNode);

    _plotPane.selectAll(".link")
      .data(Array.from(chartModel.links.values()))
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
      .classed("vis", true)
      ;
  };
  function _updateLaneNode(s) {
    s.select("path")
      .attr("d", function(d0) {
        var pathStr = "M0," + d0.yOffset;
        d0.nodes.forEach(function(d,i,a) {
          //console.log(d)
          pathStr
            += " L" + d.x + "," + (d.y + d._initialState*-_yUnit)
            + " l" + d.duration + "," + ((d.endState - d._initialState)*-_yUnit);
        });
        pathStr += " H400";
        console.log(pathStr);
        return pathStr;
      });
  };

  function _createEventNode(selection) {
    selection
      .append("g")
      .attr("id", function(d) {return d.id})
      .classed("event", true)
      .on("mouseover", function(d) {
        d3.select(this).classed("hover", true)
      })
      .on("mouseout", function(d) {
        d3.select(this).classed("hover", false)
      })
      .call(_createEventVisual)
      .call(_updateEventNode);
  };

  function _createEventVisual(s) {
    //s.append("path").classed("vis", true);
    s.append("rect")
      .classed("bodyHandle", true)
      .call(d3.drag()
        .on("start", function(d) {
          d3.select(this).classed("dragged", true);
        })
        .on("drag", function(d) {
          if (_editMode == "move") {
            d.x += d3.event.dx;
            d3.select(this.parentNode).call(_updateEventNode)

            d3.select("#plotPane").selectAll(".link")
              .call(_updateLinkNode);
            d3.select("#plotPane").selectAll(".lane")
              .call(_updateLaneNode);

          } else if(_editMode == "link") {

          }

          d3.select("#console1").text(JSON.stringify(d));
          //d3.select("#console2").text(JSON.stringify(d3.event));
          d3.select("#console3").text(d3.mouse(this));
        })
        .on("end", function(d) {
          d3.select(this).classed("dragged", false);

          if(_editMode == "link") {
            var dropTo = d3.select("#plotPane").select(".event.hover");
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
          d.duration = Math.max(d.duration + d3.event.dx, 0);
          d3.select(this.parentNode).call(_updateEventNode)

          d3.select("#plotPane").selectAll(".link")
            .call(_updateLinkNode);
          d3.select("#plotPane").selectAll(".lane")
            .call(_updateLaneNode);

          d3.select("#console1").text(JSON.stringify(d));
          //d3.select("#console2").text(JSON.stringify(d3.event));
          d3.select("#console3").text(d3.mouse(this));
        })
        .on("end", function(d) {
          d3.select(this).classed("dragged", false);
        })
      );
  };

  function _updateEventNode(s) {
    /*
    s.select("path")
      .attr("d", function(d){
        var pathString
          = "M" + d.x + "," + (d.y + d._initialState*-50)
          + " l" + d.duration + "," + ((d.endState - d._initialState)*-50);
        return pathString;
      })
    */
    s.select("rect.bodyHandle")
      .attr("x", function(d){return d.x - 4})
      .attr("y", function(d){return d.y - Math.abs(d.endState - d._initialState)*_yUnit - 4})
      .attr("width", function(d){return d.duration + 8})
      .attr("height", function(d){return Math.abs(d.endState - d._initialState)*_yUnit + 8});
    s.select("rect.resizeHandle")
      .attr("x", function(d){return d.x + d.duration + 4})
      .attr("y", function(d){return d.y - Math.abs(d.endState - d._initialState)*_yUnit - 4})
      .attr("width", function(d){return 16})
      .attr("height", function(d){return Math.abs(d.endState - d._initialState)*_yUnit + 8});
  };

  function _createLinkNode(selection) {
    selection
      .append("g")
      .classed("link", true)
      .on("mouseover", function(d) {
        d3.select(this).classed("hover", true)
      })
      .on("mouseout", function(d) {
        d3.select(this).classed("hover", false)
      })
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
          = "M" + (d.fromNode.x + d.fromNode.duration) + "," + (d.fromNode.y + d.fromNode.endState * -_yUnit)
          + " L" + d.toNode.x + "," + (d.toNode.y + d.toNode._initialState * -_yUnit) ;
        return pathString;
      })
  };

  function _changeEditMode(modeString) {
    _editMode = modeString;
  }

  return {
    init: _init,
    createView: _createView,
    changeEditMode: _changeEditMode
  };

}(d3));
