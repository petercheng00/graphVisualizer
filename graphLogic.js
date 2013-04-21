var graphLogic = (function() {
    var states = Object.freeze({"draw":1, "validate":2, "filledges":3});
    var state;
    // these are references
    var lNodes, rNodes, edges;
    var clear_button, continue_button;
    var init = function() {
        continue_button = document.getElementById("continue_button");
        clear_button = document.getElementById("clear_button");

	state = states["draw"];
	showText("Draw your bipartite graph in the area to the left. When finished, please click \"Continue\"");
	continue_button.onclick = function() {
	    continueController();
	}
    };

    var continueController = function() {
	switch(state)
	{
	case states["draw"]:
	    doneDrawing();
	    break;
	case states["validate"]:
	    addZeroWeightEdges();
	    break;
	case states["filledges"]:
	    solveGraph();
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
	    showText("Graph is valid. Zero-weight edges will be added now.");
	    advanceState();
        }
        else
        {
            showText("Error - Graph does not have nodes on both sides. Please fix your graph and then click \"Continue\"");
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
	showText("Click \"Continue\" to begin the algorithm");
    };

    var solveGraph = function() {
	showText("not implemented yet...");
    };



    var advanceState = function() {
	++state;
	console.log("advancing state to " + state);
    };

    var setState = function(s) {
	console.log("setting state to " + s);
	state = states[s];
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


    return {
	init: init,
	showText: showText
    };
})();