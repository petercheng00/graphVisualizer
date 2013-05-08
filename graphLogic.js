var graphLogic = (function() {

//--------------- Variables and Initialization ---------------

    var states = Object.freeze({"draw":1, "initialize":2, "tightEdges":3, "augmentPath":4, "updatePrices":5, "done":6});
    var state;
    // these are references
    var lNodes, rNodes, edges;
    var rMatched, augPath, minEdgeDiff;
    var lNodesSeen = [];
    var rNodesSeen = [];
    var clear_button, continue_button, back_button;
    var history = [];
    var init = function() {
        continue_button = document.getElementById("continue_button");
	back_button = document.getElementById("back_button");
        clear_button = document.getElementById("clear_button");
	back_button.disabled = true;
	back_button.onclick = goBack;
        window.addEventListener('keydown', doKeyDown, true);
	state = states["draw"];
	setupState();
    };

//--------------- Maximum Matching Algorithm ---------------

    var doKeyDown = function(evt) {
        switch (evt.keyCode) {
            case 37:
            back_button.click();
            break;
            case 39:
            continue_button.click();
            break;
        }
    };
    var validateGraph = function() {
	graphDraw.stop_draw();
	lNodes = graphDraw.lNodes;
	rNodes = graphDraw.rNodes;
	edges = graphDraw.edges;
        if (lNodes.length < 1) {
            showText("Error - Graph does not have nodes on both sides. Please fix your graph before continuing");
	    history.length = history.length -1;
            graphDraw.resume_draw();
        }
        else if (lNodes.length != rNodes.length) {
            showText("Error - Graph should have same number of nodes on both sides. Please fix your graph before continuing");
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
            if (calcEdgeDiff(edges[e]) == 0) {
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
        lNodesSeen = [];
        rNodesSeen = [];
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
        var node;
        if (isLeft) {
            node = lNodes[n];
            lNodesSeen.push(node);
        }
        else {
            node = rNodes[n];
            rNodesSeen.push(node);
        }
        for (var e = 0; e < node.edges.length; ++e) {
            var edge = node.edges[e];
            if (calcEdgeDiff(edge) == 0 && edgesSeen.indexOf(edge) < 0) {
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
        minEdgeDiff = Infinity;
        for (var n = 0; n < lNodesSeen.length; ++n) {
            for (var e = 0; e < lNodesSeen[n].edges.length; ++e) {
                var edge = lNodesSeen[n].edges[e];
                if (calcEdgeDiff(edge) < minEdgeDiff && rNodesSeen.indexOf(rNodes[edge.r]) < 0) {
                    minEdgeDiff = calcEdgeDiff(edge);
                }
            }
            lNodesSeen[n].highlight = true;
        }
        for (var n = 0; n < rNodesSeen.length; ++n) {
            rNodesSeen[n].highlight = true;
        }
        setState("updatePrices");
    };

    var updatePrices = function() {
        for (var n = 0; n < lNodesSeen.length; ++n) {
            lNodesSeen[n].p -= minEdgeDiff;
            lNodesSeen[n].highlight = false;
        }
        for (var n = 0; n < rNodesSeen.length; ++n) {
            rNodesSeen[n].p += minEdgeDiff;
            rNodesSeen[n].highlight = false;
        }
        colorTightEdges();
        setState("tightEdges");
    };

    var completeGraph = function() {
        for (var e = 0; e < edges.length; ++e) {
            if (!edges[e].matched) {
                edges.splice(e,1);
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
	    showText("Draw your bipartite graph in the area to the left.\nHit the right arrow button below when finished drawing.");
            graphDraw.resume_draw();
	    continue_button.onclick = function(){addToHistory(); validateGraph();}
	    break;
	case states["initialize"]:
	    showText("Zero-weight edges added.\nVertex values of left side initialized to maximum weight of touching edges.\n" +
                     "Vertex values of right side initialized to zero.");
	    continue_button.onclick = function(){addToHistory(); colorTightEdges();}
	    break;
	case states["tightEdges"]:
	    showText("Matched edges in green.\nTight edges in red.\nOther edges in black.");
	    continue_button.onclick = function(){addToHistory(); findAugment();}
	    break;
        case states["augmentPath"]:
	    showText("Augmented Path Algorithm\nGoal: Reach an unmatched node on right side starting from an unmatched node on left side.\n" +
                     "Constraints: Use only unmatched tight edges when going from left to right, and matched edges when going from right to left.\n\n" +
                     "Found an augmented path (colored in purple). Will swap the matched and unmatched edges in the path to increase the matching by 1 edge.");
	    continue_button.onclick = function(){addToHistory(); augmentPath();}
	    break;
        case states["updatePrices"]:
	    showText("Nodes in blue can be reached by paths starting from an unmatched node on left side subjected to constraints below.\n" +
                     "Constraints: Use only unmatched tight edges when going from left to right, and matched edges when going from right to left.\n" +
                     "Lemma: There are no tight edges between blue nodes on left side and green nodes on right side.\n\n" +
                     "Blue nodes will adjust their prices by the minimum difference between the weight of edges linking " +
                     "left blue nodes and right green nodes and the sum of the touching node prices for the same edges.\n" +
                     "Blue nodes on the left will decrease their prices by the amount below, while blue nodes on the right " +
                     "will increase their prices by the same amount.\n" +
                     "Minimum Edge Difference: " + minEdgeDiff);
	    continue_button.onclick = function(){addToHistory(); updatePrices();}
	    break;
        case states["done"]:
	    showText("Matching completed - all nodes on left side are matched to a different node on right side, with maximum weight across all selected edges.");
	    continue_button.onclick = function(){addToHistory();}
	    break;
	default:
	    showText("Congratulations! You hacked the code. You shouldn't see this.");
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

    var calcEdgeDiff = function(edge) {
        return lNodes[edge.l].p + rNodes[edge.r].p - edge.w;
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
        var prevHistory = history[history.length-1];
	state = prevHistory.state;
	lNodes.length = 0;
	rNodes.length = 0;
	edges.length = 0;
	for (var i = 0; i < prevHistory.lNodes.length; ++i)
	{
	    lNodes.push(prevHistory.lNodes[i]);
	}
	for (var i = 0; i < prevHistory.rNodes.length; ++i)
	{
	    rNodes.push(prevHistory.rNodes[i]);
	}
	for (var i = 0; i < prevHistory.edges.length; ++i)
	{
	    edges.push(prevHistory.edges[i]);
	}

        if (state == states["updatePrices"]) {
            lNodesSeen.length = 0;
            rNodesSeen.length = 0;
	    for (var i = 0; i < prevHistory.lNodesSeen.length; ++i) {
	        lNodesSeen.push(prevHistory.lNodesSeen[i]);
	    }
            for (var i = 0; i < prevHistory.rNodesSeen.length; ++i) {
	        rNodesSeen.push(prevHistory.rNodesSeen[i]);
	    }
            minEdgeDiff = prevHistory.minEdgeDiff;
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
        var currHistory = {state:state, lNodes:cloneLNodes, rNodes:cloneRNodes, edges:cloneEdges};

        if (state == states["updatePrices"]) {
            cloneLNodesSeen = [];
            cloneRNodesSeen = [];
	    for (var i = 0; i < lNodesSeen.length; ++i)
	    {
	        cloneLNodesSeen.push(clone(lNodesSeen[i]));
	    }
            for (var i = 0; i < rNodesSeen.length; ++i)
	    {
	        cloneRNodesSeen.push(clone(rNodesSeen[i]));
	    }
            currHistory.lNodesSeen = cloneLNodesSeen;
            currHistory.rNodesSeen = cloneRNodesSeen;
            currHistory.minEdgeDiff = minEdgeDiff;
        }
	history.push(currHistory);
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