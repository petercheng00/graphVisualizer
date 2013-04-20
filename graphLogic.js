var graphLogic = (function() {
    var lNodes, rNodes, edges;
    var clear_button, finish_button
    var init = function() {
        finish_button = document.getElementById("finish_button");
        clear_button = document.getElementById("clear_button");

	showText("Draw your bipartite graph in the area to the left. When finished, please click \"Done Drawing\"");
	initFinishButton();
    };

    var initFinishButton = function() {
        finish_button.onclick = function() {
	    console.log('Done drawing');
            finish_button.disabled = true;
            clear_button.disabled = true;
	    graphDraw.stop_draw();
	    lNodes = graphDraw.lNodes;
	    rNodes = graphDraw.rNodes;
	    edges = graphDraw.edges;
	    console.log('lNodes are');
	    console.log(lNodes);
	    console.log('rNodes are');
	    console.log(rNodes);
	    console.log('Edges are');
	    console.log(edges);
	    validateGraph();
            showText('Graph is Valid');
	    solveGraph();
	    showSteps();
	}
    };

    var showText = function(t) {
	document.getElementById("textBox").value = t;
    };


    var validateGraph = function() {
        if (lNodes.length < 1 || rNodes.length < 1)
        {
            showText("Error - Graph does not have nodes on both sides. Please fix your graph and then click \"Done Drawing\"");
            lNodes.length = 0;
            rNodes.length = 0;
            edges.length = 0;
            finish_button.disabled = false;
            clear_button.disabled = false;
            graphDraw.resume_draw();
        }
    };

    var fillInGraph = function() {
	//add zero weight edges
    };

    var solveGraph = function() {
	//solve algo, save steps in some format
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
    };


    return {
	init: init,
	showText: showText
    };
})();