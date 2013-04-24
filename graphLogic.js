var graphLogic = (function() {

//--------------- Variables and Initialization ---------------

    var states = Object.freeze({"draw":1, "initialize":2, "tightEdges":3, "augmentPath":4, "updatePrices":5, "done":6});
    var state;
    // these are references
    var lNodes, rNodes, edges;
    var rMatched, augPath, nodesSeen, minPrice;
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
    
//--------------- Maximum Matching Algorithm ---------------

    var validateGraph = function() {
	graphDraw.stop_draw();
	lNodes = graphDraw.lNodes;
	rNodes = graphDraw.rNodes;
	edges = graphDraw.edges;
        if (lNodes.length < 1 || rNodes.length < 1) {
            showText("Error - Graph does not have nodes on both sides. Please fix your graph and then click \"Continue\"");
	    history.length = history.length -1;
            graphDraw.resume_draw();
        }
        else {addZeroWeightEdges();}
    };

    var addZeroWeightEdges = function() {
	for (var i = 0; i < lNodes.length; ++i)
	{
	    for (var j = 0; j < rNodes.length; ++j)
	    {
		if (getEdge(i, j) == null)
		{
		    edges.push({l:i, r:j, w:0});
		}
	    }
	}
        initVertexCover();
    };
    
    var initVertexCover = function() {
        for (var n = 0; n < rNodes.length; ++n) {
            rNodes[n].p = 0;
            rNodes[n].edges = [];
        }
        for (var n = 0; n < lNodes.length; ++n) {
            var node = lNodes[n];
            node.p = 0;
            node.edges = getTouchingEdges(n);
            for (var e = 0; e < node.edges.length; ++e) {
                if (node.p < node.edges[e].w) {
                    node.p = node.edges[e].w;
                }
                rNodes[node.edges[e].r].edges.push(node.edges[e]);
            }
        }
        advanceState();
    };

    var colorTightEdges = function() {
	for (var e = 0; e < edges.length; ++e)
	{
            if (isTightEdge(edges[e])) {
                edges[e].tight = true;
            }
            else {
                edges[e].tight = false;
            }
	}
	advanceState();
    };
    
    var findAugment = function() {
        augPath = [];
        nodesSeen = [];
        var matchedNodes = getMatchedNodes();
        if (matchedNodes[0] >= lNodes.length) {
            completeGraph();
            return;
        }
        for (var n = 0; n < lNodes.length; ++n) {
            if (!matchedNodes[1].hasOwnProperty(n)) {
                if (findAugmentPath(n,true,[])) {
                    advanceState();
                    return;
                }
            }
        }
        highlightNodesSeen();
    };

    var findAugmentPath = function(n,isLeft,edgesSeen) {
        var node = isLeft ? lNodes[n] : rNodes[n];
        nodesSeen.push([isLeft,node]);
        for (var e = 0; e < node.edges.length; ++e) {
            var edge = node.edges[e];
            if (isTightEdge(edge) && edgesSeen.indexOf(edge)<0) {
                if (isLeft && !edge.matched) {
                    if (!rMatched.hasOwnProperty(edge.r)) {
                        return augmentEdge(edge);
                    }
                    if (findAugmentPath(edge.r,false,edgesSeen.concat([edge]))) {
                        return augmentEdge(edge);
                    }
                }
                else if (!isLeft && edge.matched) {
                    if (findAugmentPath(edge.l,true,edgesSeen.concat([edge]))) {
                        return augmentEdge(edge);
                    }
                }
            }
        }
        return false;
    };
    
    var augmentEdge = function(edge) {
        edge.augment = true;
        augPath.push(edge);
        return true;
    };
    
    var augmentPath = function() {
        for (var e = 0; e < augPath.length; ++e) {
            augPath[e].augment = false;
            augPath[e].matched = !augPath[e].matched;
        }
        setState("tightEdges");
    };
    
    var highlightNodesSeen = function() {
        minPrice = Infinity;
        for (var n = 0; n < nodesSeen.length; ++n) {
            if (nodesSeen[n][0] && nodesSeen[n][1].p < minPrice) {
                minPrice = nodesSeen[n][1].p;
            }
            nodesSeen[n][1].highlight = true;
        }
        setState("updatePrices");
    };
    
    var updatePrices = function() {
        for (var n = 0; n < nodesSeen.length; ++n) {
            if (nodesSeen[n][0]) {
                nodesSeen[n][1].p -= minPrice;
            }
            else {
                nodesSeen[n][1].p += minPrice;
            }
            nodesSeen[n][1].highlight = false;
        }
        setState("tightEdges");
    };
    
    var completeGraph = function() {
        for (var e = 0; e < edges.length; ++e) {
            if (!edges[e].matched) {
                edges.splice(e,e);
                e--;
            }
        }
        setState("done");
    };
    
//--------------- Interaction States ---------------
    
    var setupState = function() {
        graphDraw.redrawGraph();
	console.log("setup state: " + state);
	switch(state)
	{
	case states["draw"]:
	    showText("Draw your bipartite graph in the area to the left. Hit the right arrow button below when finished drawing.");
            graphDraw.resume_draw();
	    continue_button.onclick = function(){addToHistory(); validateGraph();}
	    break;
	case states["initialize"]:
	    showText("Zero-weight edges added. Vertex values of left side initialized to maximum weight of touching edges." +
                     " Vertex values of right side initialized to zero.");
	    continue_button.onclick = function(){addToHistory(); colorTightEdges();}
	    break;
	case states["tightEdges"]:
	    showText("Matched edges in green.\nTight edges in red.");
	    continue_button.onclick = function(){addToHistory(); findAugment();}
	    break;
        case states["augmentPath"]:
	    showText("Augmented path colored in yellow.");
	    continue_button.onclick = function(){addToHistory(); augmentPath();}
	    break;
        case states["updatePrices"]:
	    showText("Update prices.");
	    continue_button.onclick = function(){addToHistory(); updatePrices();}
	    break;
        case states["done"]:
	    showText("Done.");
	    continue_button.onclick = function(){addToHistory();}
	    break;
	default:
	    showText("You shouldn't see this");
	}
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
    
    var showText = function(t) {
	document.getElementById("textBox").value = t;
    };
    
//--------------- Helper Functions ---------------
    
    var getEdge = function(lNode, rNode) {
        for (var e = 0; e < edges.length; ++e)
        {
            if (edges[e].l == lNode && edges[e].r == rNode)
            {
                return edges[e];
            }
        }
	return null;
    };
    
    var getTouchingEdges = function(lNode) {
        var touchingEdges = [];
        for (var e = 0; e < edges.length; ++e)
        {
            if (edges[e].l == lNode)
            {
                touchingEdges.push(edges[e]);
            }
        }
	return touchingEdges;
    };
    
    var isTightEdge = function(edge) {
        return (lNodes[edge.l].p + rNodes[edge.r].p) == edge.w;
    };
    
    var getMatchedNodes = function() {
        var size = 0;
        var lMatched = {};
        rMatched = {};
        for (var e = 0; e < edges.length; ++e) {
            if (edges[e].matched) {
                size++;
                lMatched[edges[e].l] = true;
                rMatched[edges[e].r] = true;
            }
        }
        return [size, lMatched];
    };
    
//--------------- History ---------------
    
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
	history.length = history.length-1;
	graphDraw.redrawGraph();
	setupState();
    };

    var addToHistory = function() {
	console.log("adding to history");
	cloneLNodes = [];
	cloneRNodes = [];
	cloneEdges = [];
        cloneMatchedEdges = {};
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
	history.push({state:state, lNodes:cloneLNodes, rNodes:cloneRNodes, edges:cloneEdges});
	if (history.length > 0)
	{
	    back_button.disabled = false;
	}
    };

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
