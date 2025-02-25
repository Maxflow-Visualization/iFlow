// INTERACTIVITY (WHAT TO DO WHEN THERE'S AN USER INPUT OTHER THAN ALGORITHMS-RELATED BUTTONS) IMPLEMENTATIONS
var $cy = $("#cy");
var rightClickedEdge = null;
var lastRightClickedNode;

// DOUBLE CLICK TO CREATE A NODE
function doubleClickCreateNode (e) {
  // Students can only add nodes during graph creation
  if (inGraphCreation() && !e.target.matches(".cy-panzoom-reset")) {
    // Adjust position with zoom and pan
    var zoom = cy.zoom();
    var pan = cy.pan();
    var posX = (e.pageX - $cy.offset().left - pan.x) / zoom;
    var posY = (e.pageY - $cy.offset().top - pan.y) / zoom;

    var nextId = getNextId();
    // Automatically make the new node as the source if it's id is 1
    if (nextId === 1) {
      cancelHighlightedNodes([sink]);
      $("#source").text("Source=" + nextId);
      source = nextId;
      highlightSourceAndSink();
    }
    // Automatically make the new node as the sink if it's greater than the current max id
    if (nextId > 1 && nextId === getMaxId() + 1) {
      cancelHighlightedNodes([source]);
      $("#sink").text("Sink=" + nextId);
      sink = nextId;
      highlightSourceAndSink();
    }

    addNode(cy, nextId, nextId, posX, posY);
  }
}
$cy.dblclick(doubleClickCreateNode);

// BACKSPACE OR DELETE TO REMOVE A NODE/EDGE
function backspaceOrDeleteRemoveElement(e) {
  state = states[stateIndex];
  if (inGraphCreation() ||
    (state === UPDATE_RESIDUAL_GRAPH && cy.$(":selected").isEdge() && !cy.$(":selected").css("label").includes("/"))) {
    // Delete only if user is not updating capacity, I know this !"is not hidden" is really weird. However, jQuery's "is hidden"
    // only checks for css attributes display and visibility whereas jQuery's hide does not change those attributes but rather caches them...
    if ((e.key == "Delete" || e.key == "Backspace") && !$("#mouse-update").is(":not(':hidden')")) {
      const inputElement = document.getElementById("label");
      // Check if there's a selection within the input
      if (document.activeElement != inputElement) {
        checkDeletedNodeIsSourceOrSink(cy.$(":selected").id());
        cy.$(":selected").remove();
      }
    }
  }
}
$("html").keydown(backspaceOrDeleteRemoveElement);

// "CLEAR" BUTTON TO CLEAR THE CY DRAWBOARD
function clearDrawboard(e){
  e.preventDefault();
  cy.nodes().remove();
  cy.edges().remove();

  $("#source").text("Source=");
  $("#sink").text("Sink=");

  $("#status").text("");
  $("#label").val("");
}
$("#clear").on("click", clearDrawboard);

// "EXAMPLE" BUTTON TO CREATE THE EXAMPLE GRAPH
function createExampleGraph(e) {
  $("#clear").triggerHandler("click");
  e.preventDefault();
  $("#source").text("Source=1");
  $("#sink").text("Sink=5");
  var nodes = [
    { id: 1, name: 1, x: 680, y: 80 },
    { id: 2, name: 2, x: 153, y: 252 },
    { id: 3, name: 3, x: 1261, y: 251 },
    { id: 4, name: 4, x: 337, y: 680 },
    { id: 5, name: 5, x: 1059, y: 683 },
  ];
  var edges = [
    { id: "1-2", label: 3, source: 1, target: 2 },
    { id: "1-3", label: 3, source: 1, target: 3 },
    { id: "2-3", label: 1, source: 2, target: 3 },
    { id: "2-4", label: 2, source: 2, target: 4 },
    { id: "2-5", label: 1, source: 2, target: 5 },
    { id: "3-5", label: 2, source: 3, target: 5 },
    { id: "4-5", label: 2, source: 4, target: 5 },
  ];
  nodes.forEach(function (node) {
    addNode(cy, node.id, node.name, node.x, node.y);
  });
  edges.forEach(function (edge) {
    addEdge(cy, edge.id, { label: edge.label }, edge.source, edge.target);
  });
}
$("#example-graph").on("click", createExampleGraph);
// Bring up the example graph initially when user opens the website
$("#example-graph").trigger("click");

// RIGHT CLICK ON AN EDGE BRINGS UP A BOX TO UPDATE ITS CAPACITY, ONLY AVAILABLE IN GRAPH_CREATION AND UPDATE_RESIDUAL_GRAPH
function showUpdateCapacityBox(e) {
  state = states[stateIndex];
  if ((inGraphCreation() || state == UPDATE_RESIDUAL_GRAPH) && !e.cyTarget.style().label.includes("/")) {
    var mouseX = e.originalEvent.clientX;
    var mouseY = e.originalEvent.clientY;
    rightClickedEdge = e.cyTarget;
    $("#mouse-label").val(rightClickedEdge.css("label"));

    // Set the text and position of the floating div
    var floatingText = document.getElementById("floatingText");
    floatingText.style.display = "block";
    floatingText.style.left = mouseX + "px";
    floatingText.style.top = mouseY + "px";
  }
}
cy.on("cxttap", "edge", showUpdateCapacityBox);

// CLICKING "UPDATE" IN THAT BOX UPDATES THE EDGE'S CAPACITY
function updateCapacity(e) {
  e.preventDefault();
  var $mouseLabel = $("#mouse-label");
  var label = $mouseLabel.val();
  if (isNaN(parseFloat(label)) || parseFloat(label) < 0) {
    $mouseLabel.css("border", "1px solid red");
    return;
  }
  if (parseFloat(label) === 0) {
    rightClickedEdge.remove();
  } else {
    rightClickedEdge.css("label", label);
  }
  $mouseLabel.css("border", "1px solid #18a689");
  if (!rightClickedEdge) return;

  rightClickedEdge.css("label", label);

  var floatingText = document.getElementById("floatingText");
  floatingText.style.display = "none";

  removeOriginalCapacitiesAndCurrentFlow();
  if (showOriginalCapacitiesAndCurrentFlow) {
    doShowOriginalCapacitiesAndCurrentFlow();
  }
  floatingText.style.display = "none";
}
$("#mouse-update").on("click", updateCapacity);

// PRESSING ENTER IS THE SAME AS CLICKING "UPDATE"
$(document).on("keydown", function (e) {
  var floatingText = document.getElementById("floatingText");
  if (e.which === 13 && floatingText.style.display === "block") {
    $("#mouse-update").click();
  }
});

// RIGHT CLICK ON A NODE BRINGS UP A BOX TO MARK IT AS THE SOURCE OR THE SINK OR DELETE IT
function showMarkAsSourceOrSinkBox(e) {
  if (inGraphCreation()) {
    var markAsSourceOrSinkDiv = document.getElementById("mark-as-source-or-sink");

    var mouseX = e.originalEvent.clientX;
    var mouseY = e.originalEvent.clientY;
    markAsSourceOrSinkDiv.style.display = "block";
    markAsSourceOrSinkDiv.style.left = mouseX + "px";
    markAsSourceOrSinkDiv.style.top = mouseY + "px";

    lastRightClickedNode = e.cyTarget;
  }
}
cy.on("cxttap", "node", showMarkAsSourceOrSinkBox);

// CLICKING "MARK AS THE SOURCE" IN THAT BOX MARKS THE NODE AS SOURCE
function markAsSource(e) {
  e.preventDefault();
  source = lastRightClickedNode.id();
  $("#source").text("Source=" + source);
  cancelHighlightedNodes([source, sink]);
  highlightSourceAndSink();
  document.getElementById("mark-as-source-or-sink").style.display = "none";
}
$("#mark-as-source").on("click", markAsSource);

// CLICKING "MARK AS THE SINK" IN THAT BOX MARKS THE NODE AS SINK
function markAsSink(e) {
  e.preventDefault();
  sink = lastRightClickedNode.id();
  $("#sink").text("Sink=" + sink);
  cancelHighlightedNodes([source, sink]);
  highlightSourceAndSink();
  document.getElementById("mark-as-source-or-sink").style.display = "none";
}
$("#mark-as-sink").on("click", markAsSink);

// CLICKING "DELETE" IN THAT BOX DELETES THE NODE
function deleteNodeByBox(e) {
  e.preventDefault();
  checkDeletedNodeIsSourceOrSink(lastRightClickedNode.id());
  lastRightClickedNode.remove();
  document.getElementById("mark-as-source-or-sink").style.display = "none";
}
$("#delete-node").on("click", deleteNodeByBox);

// CLICKING OUTSIDE OF THE ABOVE BOXES (I.E. DRAWBOARD) DELETES THE BOXES
function clearAllBoxesIfNotClickedInside() {
  var floatingText = document.getElementById("floatingText");
  var markAsSourceOrSinkDiv = document.getElementById("mark-as-source-or-sink");
  function clickInsideElement(event, element) {
    var target = event.target;
    do {
      if (target === element) {
        return true;
      }
      target = target.parentNode;
    } while (target);

    return false;
  }
  var isClickInsideFloatingText = clickInsideElement(event, floatingText);
  if (!isClickInsideFloatingText) {
    floatingText.style.display = "none";
  }
  var isClickInsideMarkAsSourceOrSinkDiv = clickInsideElement(event, markAsSourceOrSinkDiv);
  if (!isClickInsideMarkAsSourceOrSinkDiv) {
    markAsSourceOrSinkDiv.style.display = "none";
  }
}
document.addEventListener("click", clearAllBoxesIfNotClickedInside);