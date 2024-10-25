// INTERACTIVITY HELPER FUNCTIONS
// THESE FUNCTIONS ARE USED IN interactivity.js: inGraphCreation(), addNode(), addEdge(), getMaxId(), getNextId(), checkDeletedNodeIsSourceOrSink(), cancelHighlightedNodes(), highlightSourceAndSink()
// THESE FUNCTIONS ARE USED IN app.js: inGraphCreation(), addEdge(), cancelHighlightedNodes(), highlightEdge(), cancelHighlightedEdge(), highlightSourceAndSink(), cancelHighlightedElements()

// Check which mode are we in: modifying or practicing
function inGraphCreation() {
  return $("#state").text().includes("State: Graph Creation");
}

// Add node with given args
function addNode(cy, id, name, posX, posY) {
  cy.add({
    group: "nodes",
    data: {
      id: id,
      name: name,
    },
    position: {
      x: posX,
      y: posY,
    },
    selectable: true,
  });
}

// Add edge with given args
function addEdge(cy, id, style, source, target) {
  cy.add({
    group: "edges",
    data: {
      id: id,
      source: source,
      target: target,
    },
    selectable: true,
    style: style,
  });
}

function getMaxId() {
  var ids = cy.nodes().map(function (node) {
    return Number(node.id());
  });
  return Math.max(...ids);
}

// Gets the next id (i.e. the first id missing in the current sorted node ids)
function getNextId() {
  if (cy.nodes().length === 0) {
    return 1;
  }
  var maxId = getMaxId();
  var ids = new Set(cy.nodes().map(function (node) {
    return Number(node.id());
  }));
  for (var i = 1; i < maxId; ++i)
  {
    if (!ids.has(i)) {
      return i;
    }
  }
  return maxId + 1;
}

// Check if users deleted a node that is source/sink, if so change the display text
function checkDeletedNodeIsSourceOrSink(nodeId)
{
  if (nodeId == source)
  {
    $("#source").text("Source=");
  }
  if (nodeId == sink)
  {
    $("#sink").text("Sink=");
  }
}

// Cancel all highlighed nodes except the ones with ids in exceptNodeIdsList
function cancelHighlightedNodes(exceptNodeIdsList = []) {
  let filteredNodes = cy.collection();
  cy.nodes().forEach( function (node) {
    if (!exceptNodeIdsList.includes(node["_private"]["data"]["id"])) {
      filteredNodes = filteredNodes.union(node);
    }
  });
  filteredNodes.style("border-color", "black");
  filteredNodes.style("background-color", "white");
}

// Make edge highlighted with given args
function highlightEdge(source, target) {
  cy.edges("[source='" + source + "'][target='" + target + "']").addClass(
    "highlighted"
  );
}

// Cancel one edge's highlight
function cancelHighlightedEdge(source, target) {
  edge = cy.edges("[source='" + source + "'][target='" + target + "']");
  edge.removeClass("highlighted");
  edge.css("line-color", "lightgray");
  edge.css("target-arrow-color", "lightgray");
}

// For some reason this function needs to be called in multiple places that shouldn't need to call it
function highlightSourceAndSink() {
  cy.style()
    .selector("#" + source)
    .style({
      "background-color": "#87CEEB",
    })
    .update();
  cy.style()
    .selector("#" + sink)
    .style({
      "background-color": "#FFCCCB",
    })
    .update();
}

// Cancel all highlights
function cancelHighlightedElements() {
  cy.elements().removeClass("highlighted");
}