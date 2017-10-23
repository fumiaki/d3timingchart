// Chart Model Definision

// Main module
var ChartFactory = (function(global) {

  function _createChart(jsonData) {
    var chart = new Chart(jsonData);

    return chart;
  };

  return {
    createChart: _createChart
  };

}(this));

class Chart {
  constructor(jsonData) {
    this.nodes = new Map();
    this.links = new Map();
    this.lanes = new Map();

    this.createNodes(jsonData.nodes);
    this.createLinks(jsonData.links);
    this.createLanes(jsonData.lanes);

  }

  createNode(paramObj) {
    var node = new Node(paramObj);

    this.nodes.set(node.id, node);
    return node;
  }
  createNodes(paramObjArray) {
    var self = this;
    return paramObjArray.map(function(paramObj) {
      return self.createNode(paramObj);
    })
  }

  createLink(paramObj) {
    var link = new Link(paramObj);
    link.fromNode = this.nodes.get(link.from);
    link.toNode = this.nodes.get(link.to);

    this.links.set(link.id, link);
    return link;
  }
  createLinks(paramObjArray) {
    var self = this;
    return paramObjArray.map(function(paramObj) {
      return self.createLink(paramObj);
    })
  }

  createLane(paramObj) {
    var lane = new Lane(paramObj);
    lane.nodes = this.getNodesOnLane(lane.id);
    this.lanes.set(lane.id, lane);
    return lane;
  }
  createLanes(paramObjArray) {
    var self = this;
    return paramObjArray.map(function(paramObj) {
      return self.createLane(paramObj);
    })
  }


  __getLanes() {
    var self = this;
    var laneSet = new Set();;
    Array.from(this.nodes.values()).forEach(function(v,i,a) {
      laneSet.add(v.y);
    })

    var result = [];
    laneSet.forEach(function(v,i,s) {
      result.push({
        id: "Lane " + v,
        y: v,
        data: self.getNodesOnLane(v)
      })
    })
    return result;
  }
  getNodesOnLane(laneId) {
    return Array.from(this.nodes.values())
      .filter(function(v, i, a) {
        return laneId == v.lane;
      })
      .sort(function(a, b) {
        return a.x - b.x;
      })
  }
}

class Node {
  constructor(paramObj) {
    var defaultValue = {
      id: generateUuid(),
      name:"Event xxx",
      object:"ROBOT xxx",
      _initialState: 0,
      endState: 1,
      duration:50,
      y: 100, x: 0
    };
    // Marge paramObject to default object
    Object.assign(this, defaultValue);
    Object.assign(this, paramObj);
  }
}

class Link {
  constructor(paramObj) {
    var defaultValue = {
      id: generateUuid(),
      name:"Link xxx",
      from: "",
      to: "",
      y: 100, x: 0
    };
    // Marge paramObject to default object
    Object.assign(this, defaultValue);
    Object.assign(this, paramObj);
  }
}

class Lane {
  constructor(paramObj) {
    var defaultValue = {
      id: generateUuid(),
      name:"Lane xxx",
      color: "#ff9800",
      stateLabels: [
        {"v":0, "label": "OFF"},
        {"v":1, "label": "ON"},
      ]
    };
    // Marge paramObject to default object
    Object.assign(this, defaultValue);
    Object.assign(this, paramObj);
  }
}

function generateUuid() {
    let chars = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".split("");
    for (let i = 0, len = chars.length; i < len; i++) {
        switch (chars[i]) {
            case "x":
                chars[i] = Math.floor(Math.random() * 16).toString(16);
                break;
            case "y":
                chars[i] = (Math.floor(Math.random() * 4) + 8).toString(16);
                break;
        }
    }
    return chars.join("");
}
