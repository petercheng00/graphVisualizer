var graphLogic = (function() {
    var lNodes, rNodes, edges;
    var init = function() {
        var finish_button = document.getElementById("finish_button");
        finish_button.onclick = function() {
	    console.log('Done drawing');
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
	    solveGraph();
	    showSteps();
	}
    };

    var validateGraph = function() {
	//make sure graph is legal here
    }

    var solveGraph = function() {
	//solve algo, save steps in some format
    }

    var showSteps = function() {
	//show each step to get to solution
    }

    
    return {
	init: init
    };
})();