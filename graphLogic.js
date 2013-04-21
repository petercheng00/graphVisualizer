var graphLogic = (function() {
    var states = Object.freeze({"draw":1, "validate":2, "filledges":3});
    var state;
    // these are references
    var lNodes, rNodes, edges;
    var clear_button, continue_button, back_button;
    var history = [];
    var init = function() {
        continue_button = document.getElementById("continue_button");
	back_button = document.getElementById("back_button");
        clear_button = document.getElementById("clear_button");
	back_button.disabled = true;
	back_button.onclick = goBack;
	state = states["draw"];
	setupState();
    };
    
    var setupState = function() {
	console.log("setup state: " + state);
	switch(state)
	{
	case states["draw"]:
	    showText("Draw your bipartite graph in the area to the left. Hit the right arrow button below when finished drawing.");
            graphDraw.resume_draw();
	    continue_button.onclick = function(){addToHistory();doneDrawing();};
	    break;
	case states["validate"]:
	    showText("Your graph is valid. Zero-weight edges will be added next to fill the graph.");
	    continue_button.onclick = function(){addToHistory();addZeroWeightEdges()};;
	    break;
	case states["filledges"]:
	    showText("Zero-weight edges have been added to fill the graph.");
	    continue_button.onclick = function(){addToHistory();solveGraph()};
	    break;
	default:
	    showText("You shouldn't see this");
	}
    };

    var doneDrawing = function() {
	graphDraw.stop_draw();
	lNodes = graphDraw.lNodes;
	rNodes = graphDraw.rNodes;
	edges = graphDraw.edges;
	if (validateGraph())
        {
	    advanceState();
        }
        else
        {
            showText("Error - Graph does not have nodes on both sides. Please fix your graph and then click \"Continue\"");
	    history.length = history.length -1;
            graphDraw.resume_draw();
        }
    };


    var showText = function(t) {
	document.getElementById("textBox").value = t;
    };


    var validateGraph = function() {
        return (lNodes.length >= 1 && rNodes.length >= 1)
    };

    var addZeroWeightEdges = function() {
	for (var i = 0; i < lNodes.length; ++i)
	{
	    for (var j = 0; j < rNodes.length; ++j)
	    {
		if (getEdge(i, j) == null)
		{
		    edges.push({l:i, r:j, w:0});
		    graphDraw.redrawGraph();
		}
	    }
	}
	advanceState();
    };

    var solveGraph = function() {
	for (var i = 0; i < lNodes.length; ++i)
	{
	    lNodes[i].p = 100;

	}
	edges[0].matched = true;
	edges[1].tight = true;
	graphDraw.redrawGraph();
	setState(-1);
    };



    var advanceState = function() {
	++state;
	setupState();
    };

    var setState = function(s) {
	console.log("setting state to " + s);
	state = states[s];
	setupState();
    };

    var getEdge = function(lNode, rNode) {
        for (var i = 0; i < edges.length; ++i)
        {
            if (edges[i].l == lNode && edges[i].r == rNode)
            {
                return edges[i];
            }
        }
	return null;
    };

    var goBack = function() {
	if (history.length == 0)
	{
	    return;
	}
	if (history.length == 1)
	{
	    back_button.disabled = true;
	}
	state = history[history.length-1].state;
	lNodes.length = 0;
	rNodes.length = 0;
	edges.length = 0;
	for (var i = 0; i < history[history.length-1].lNodes.length; ++i)
	{
	    lNodes.push(history[history.length-1].lNodes[i]);
	}
	for (var i = 0; i < history[history.length-1].rNodes.length; ++i)
	{
	    rNodes.push(history[history.length-1].rNodes[i]);
	}
	for (var i = 0; i < history[history.length-1].edges.length; ++i)
	{
	    edges.push(history[history.length-1].edges[i]);
	}
	history.length = history.length -1;
	graphDraw.redrawGraph();
	setupState();
    }

    var addToHistory = function() {
	console.log("adding to history");
	cloneLNodes = [];
	cloneRNodes = [];
	cloneEdges = [];
	for (var i = 0; i < graphDraw.lNodes.length; ++i)
	{
	    cloneLNodes.push(clone(graphDraw.lNodes[i]));
	}
	for (var i = 0; i < graphDraw.rNodes.length; ++i)
	{
	    cloneRNodes.push(clone(graphDraw.rNodes[i]));
	}
	for (var i = 0; i < graphDraw.edges.length; ++i)
	{
	    cloneEdges.push(clone(graphDraw.edges[i]));
	}
	history.push({state:state, lNodes:cloneLNodes,rNodes:cloneRNodes,edges:cloneEdges});
	if (history.length > 0)
	{
	    back_button.disabled = false;
	}
    }


    return {
	init: init,
	state: state,
	history: history,
	showText: showText
    };
})();



function clone(obj) {
    if (null == obj || "object" != typeof obj) return obj;
    var copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
}