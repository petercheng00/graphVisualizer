var graphLogic = (function() {
    // these are references
    var lNodes, rNodes, edges;
    var clear_button, continue_button
    var init = function() {
        continue_button = document.getElementById("continue_button");
        clear_button = document.getElementById("clear_button");
        waitForDraw();
    };

    var waitForDraw = function() {
	showText("Draw your bipartite graph in the area to the left. When finished, please click \"Continue\"");
        continue_button.onclick = function() {
            console.log('done drawing');
            console.log(graphDraw.lNodes);
            console.log(graphDraw.rNodes);
            console.log(graphDraw.edges);

	    graphDraw.stop_draw();
	    lNodes = graphDraw.lNodes;
	    rNodes = graphDraw.rNodes;
	    edges = graphDraw.edges;
	    if (validateGraph())
            {
                fillInGraph();
            }
            else
            {
                showText("Error - Graph does not have nodes on both sides. Please fix your graph and then click \"Done Drawing\"");
                clear_button.disabled = false;
                graphDraw.resume_draw();
            }

	}
    };

    var fillInGraph = function() {
	showText("Graph is valid. Zero-weight edges will be added now.");
	continue_button.onclick = function() {
	    addZeroWeightEdges();
	    solveGraph();
	}
    }

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
    };

    var solveGraph = function() {
	continue_button.onclick = function()
	{
	    showText("not implemented yet...");
	}
    };

    var showSteps = function() {
	//show each step to get to solution
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