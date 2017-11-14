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
    var node = new Node(paramObj, this);

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
    var link = new Link(paramObj, this);
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
    var lane = new Lane(paramObj, this);
    //console.log(lane.nodes)
    //lane.nodes = this._getNodesOnLane(lane.id);
    lane.nodes.forEach(function(node) {
      node.lane = lane;
    })

    this.lanes.set(lane.id, lane);
    return lane;
  }
  createLanes(paramObjArray) {
    var self = this;
    return paramObjArray.map(function(paramObj) {
      return self.createLane(paramObj);
    })
  }
}

class Node {
  constructor(paramObj, parent) {
    var defaultValue = {
      id: generateUuid(),
      name:"Event xxx",
      object:"ROBOT xxx",
      _initialState: 0,
      endState: 1,
      duration:50,
      t: 0
    };
    // Marge paramObject to default object
    Object.assign(this, defaultValue);
    Object.assign(this, paramObj);
    this.parent = parent;
  }
}

class Link {
  constructor(paramObj, parent) {
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
    this.parent = parent;
  }
}

class Lane {
  constructor(paramObj, parent) {
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
    this.parent = parent;
  }

  get nodes() {
    var self = this;
    var nodes_ = Array.from(self.parent.nodes.values())
      .filter((v, i, a) => self.id == v.lane || self.id == v.lane.id)
      .sort((a, b) => a.t - b.t);
    return nodes_;
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
