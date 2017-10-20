// Chart Model Definision

// Main module
var ChartFactory = (function(global) {

  function _createChart() {
    var chart = new Chart();

    return chart;
  };

  function _createNode() {

    return {};
  };

  function _createLink() {

    return {};
  };


  return {
    createChart: _createChart
  };

}(this));

class Chart {
  constructor() {
    this.nodes = new Map();
    this.links = new Map();
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

    this.links.set(link.id, link);
    return link;
  }
  createLinks(paramObjArray) {
    var self = this;
    return paramObjArray.map(function(paramObj) {
      return self.createLink(paramObj);
    })
  }
}

class Node {
  constructor(paramObj) {
    var defaultValue = {
      id: generateUuid(),
      name:"Event xxx",
      object:"ROBOT xxx",
      from: 0,
      to: 1,
      duration:50,
      y: 100,
      x: 0
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
