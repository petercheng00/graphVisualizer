var graphDraw = (function() {
    var canvas, context, canvaso, contexto;

    // The active tool instance.
    var tool;
    var tool_default = 'node';

    var lNodes = [];
    var rNodes = [];
    var node_radius = 20;

    var edges = [];

    var nodeColor = 'green';
    var nodeHighlightColor = 'blue';
    var nodeBorderColor = '#003300'

    var edgeColor = 'black';

    var weightColor = 'blue';

    var init = function() {
        // Find the canvas element.
        canvaso = document.getElementById('imageView');
        if (!canvaso) {
            alert('Error: I cannot find the canvas element!');
            return;
        }

        if (!canvaso.getContext) {
            alert('Error: no canvas.getContext!');
            return;
        }

        // Get the 2D canvas context.
        contexto = canvaso.getContext('2d');
        if (!contexto) {
            alert('Error: failed to getContext!');
            return;
        }

        // Add the temporary canvas.
        var container = canvaso.parentNode;
        canvas = document.createElement('canvas');
        if (!canvas) {
	    alert('Error: I cannot create a new canvas element!');
	    return;
        }

        canvas.id     = 'imageTemp';
        canvas.width  = canvaso.width;
        canvas.height = canvaso.height;
        container.appendChild(canvas);

        context = canvas.getContext('2d');

        var clear_button = document.getElementById("clear_button");
        clear_button.onclick = function() {
            clearCanvas();
	    initCanvas();
            lNodes = [];
	    rNodes = [];
            edges = [];
        }

        var tool_radios = document.toolForm.toolRadios;
        for (var i = 0; i < tool_radios.length; ++i)
        {
            if (tool_radios[i].value == tool_default)
            {
                tool_radios[i].checked = true;
            }
            tool_radios[i].onclick = function()
            {
                if (tools[this.value])
                {
                    tool = new tools[this.value]();
                }
            }
        }


        // Activate the default tool.
        if (tools[tool_default]) {
            tool = new tools[tool_default]();
        }

        // Attach the mousedown, mousemove and mouseup event listeners.
        canvas.addEventListener('mousedown', ev_canvas, false);
        canvas.addEventListener('mousemove', ev_canvas, false);
        canvas.addEventListener('mouseup',   ev_canvas, false);
	initCanvas();
    };

    var stop_draw = function() {
        canvas.removeEventListener('mousedown', ev_canvas);
        canvas.removeEventListener('mousemove', ev_canvas);
        canvas.removeEventListener('mouseup', ev_canvas);
        clearTempCanvas();
    }

    // The general-purpose event handler. This function just determines the mouse
    // position relative to the canvas element.
    var ev_canvas = function (ev) {
        if (ev.layerX || ev.layerX == 0) { // Firefox
            ev._x = ev.layerX;
            ev._y = ev.layerY;
        } else if (ev.offsetX || ev.offsetX == 0) { // Opera
            ev._x = ev.offsetX;
            ev._y = ev.offsetY;
        }

        // Call the event handler of the tool.
        var func = tool[ev.type];
        if (func) {
            clearTempCanvas();
            func(ev);
        }
    };

    // The event handler for any changes made to the tool selector.
    var ev_tool_change = function (ev) {
        if (tools[this.value]) {
            tool = new tools[this.value]();
        }
    };

    // This function draws the #imageTemp canvas on top of #imageView, after which
    // #imageTemp is cleared. This function is called each time when the user
    // completes a drawing operation.
    var img_update = function () {
	contexto.drawImage(canvas, 0, 0);
	context.clearRect(0, 0, canvas.width, canvas.height);
    };

    // This object holds the implementation of each drawing tool.
    var tools = {};

    // The node tool.
    tools.node = function () {
        this.mousedown = function (ev) {
            if (canDrawNode(ev._x, ev._y))
            {
                drawNode(ev._x, ev._y);
		addNode(ev._x, ev._y);
                img_update();
            }
        };

        this.mousemove = function (ev) {
            if (canDrawNode(ev._x, ev._y))
            {
                drawNode(ev._x, ev._y, '#00ee00', '#00dd00');
            }
            else
            {
                drawX(ev._x, ev._y);
            }
        };
        this.mouseup = function (ev) {
        };
    };


    // The edge tool.
    tools.edge = function () {
        this.lNode = null;
        this.rNode = null;

        this.mousedown = function (ev) {
	    var nodes = [];
	    var l = onLeft(ev._x, ev._y);
	    if (l)
	    {
		nodes = lNodes;
	    }
	    else
	    {
		nodes = rNodes;
	    }
            for (var i = 0; i < nodes.length; ++i)
            {
                if (onNode(nodes[i], ev._x, ev._y))
                {
		    if (l)
		    {
			this.lNode = i;
		    }
		    else
		    {
			this.rNode = i;
		    }
                    drawNode(nodes[i].x, nodes[i].y, nodeHighlightColor);
                    return;
                }
            }
        };



        this.mousemove = function (ev) {
	    var nearNode = null;
	    if (this.lNode == null)
	    {
		for (var i = 0; i < lNodes.length; ++i)
		{
                    if (onNode(lNodes[i], ev._x, ev._y))
                    {
			drawNode(lNodes[i].x, lNodes[i].y, 'blue');
			nearNode = i;
			break;
                    }
		}
	    }
	    if (this.rNode == null)
	    {
		for (var i = 0; i < rNodes.length; ++i)
		{
                    if (onNode(rNodes[i], ev._x, ev._y))
                    {
			drawNode(rNodes[i].x, rNodes[i].y, 'blue');
			nearNode = i;
			break;
                    }
		}
	    }
	    if (this.lNode == null && this.rNode == null)
	    {
		return;
	    }

	    var startX = null;
	    var startY = null;
	    if (this.lNode != null)
	    {
		startX = lNodes[this.lNode].x;
		startY = lNodes[this.lNode].y;
	    }
            if (this.rNode != null)
	    {
		startX = rNodes[this.rNode].x;
		startY = rNodes[this.rNode].y;
	    }

            drawNode(startX, startY, 'blue');
            context.beginPath();
            context.moveTo(startX, startY);
	    context.lineTo(ev._x, ev._y);
            context.stroke();
            context.closePath();
        };

        this.mouseup = function (ev) {
            if (this.lNode == null && this.rNode == null)
            {
                return;
            }
            if (this.lNode == null)
            {
                for (var i = 0; i < lNodes.length; ++i)
                {
                    if (onNode(lNodes[i], ev._x, ev._y))
                    {
                        this.lNode = i;
                        break;
                    }
                }
            }
            if (this.rNode == null)
            {
                for (var i = 0; i < rNodes.length; ++i)
                {
                    if (onNode(rNodes[i], ev._x, ev._y))
                    {
                        this.rNode = i;
                        break;
                    }
                }
            }

            if (this.lNode == null || this.rNode == null)
            {
                this.lNode = null;
                this.rNode = null;
                return;
            }
            drawNode(lNodes[this.lNode].x, lNodes[this.lNode].y, 'blue')
            drawNode(rNodes[this.rNode].x, rNodes[this.rNode].y, 'blue');
            if (!edgeExists(this.lNode, this.rNode))
            {
                var weight = parseFloat(prompt("Edge Weight",0));
                if (isNaN(weight))
                {
                    this.lNode = null;
                    this.rNode = null;
                    return;
                }
                clearTempCanvas();
                drawEdge(this.lNode, this.rNode, weight);
                img_update();
                edges.push({l: this.lNode, r: this.rNode, w: weight});
            }
            this.lNode = null;
            this.rNode = null;
        };
    };




    // The eraser tool.
    tools.eraser = function () {
        this.mousedown = function (ev) {
	    var nodes = [];
	    if (onLeft(ev._x, ev._y))
	    {
		nodes = lNodes;
	    }
	    else
	    {
		nodes = rNodes;
	    }
            for (var i = 0; i < nodes.length; ++i)
            {
                if (lineDistance(ev._x, ev._y, nodes[i].x, nodes[i].y) < node_radius)
                {
                    removeNode(onLeft, i);
                    clearCanvas();
                    initCanvas();
                    drawNodes();
                    drawEdges();
                    img_update();
                    return;
                }
            }
            for (var i = 0; i < edges.length; ++i)
            {
		if (onEdge(edges[i], ev._x, ev._y))
                {
                    edges.splice(i,1);
                    clearCanvas();
                    drawNodes();
                    drawEdges();
                    img_update();
                    return;
                }
            }
        };

        this.mousemove = function (ev) {
            for (var i = 0; i < nodes.length; ++i)
            {
		if (onNode(nodes[i], ev._x, ev._y))
                {
                    drawNode(nodes[i].x, nodes[i].y, '#aa0000', '#440000');
                    return;
                }
            }
            for (var i = 0; i < edges.length; ++i)
            {
		if (onEdge(edges[i], ev._x, ev._y))
                {
                    drawEdge(edges[i].l, edges[i].r, edges[i].w, 'red');
                    return;
                }
            }
        };

        this.mouseup = function (ev) {
        };
    };

    var initCanvas = function()
    {
        contexto.strokeStyle = 'grey';
        contexto.lineWidth = 1;
        contexto.beginPath();
        contexto.moveTo(canvas.width/2, 0);
        contexto.lineTo(canvas.width/2, canvas.height);
        contexto.stroke();
        contexto.closePath();


        contexto.textAlign='center'
        contexto.font="20px Arial";

        contexto.beginPath();
        contexto.fillStyle = 'black';
        contexto.fillText('U',canvas.width/4,30);
        contexto.fill();
        contexto.closePath();

        contexto.beginPath();
        contexto.fillStyle = 'black';
        contexto.fillText('V',(canvas.width*3)/4,30);
        contexto.fill();
        contexto.closePath();


    };

    var clearTempCanvas = function()
    {
	context.clearRect(0, 0, canvas.width, canvas.height);
    };
    var clearCanvas = function()
    {
	contexto.clearRect(0, 0, canvaso.width, canvaso.height);
    };




    var onLeft = function(x, y)
    {
	return x < canvas.width/2;
    };
    var onNode = function(n, x, y)
    {
	return lineDistance(x, y, n.x, n.y) < node_radius;
    };

    var onEdge = function(e, x, y)
    {
	return (distToSegment({x: x, y:y}, nodes[e.l], nodes[e.r]) < node_radius)
    };

    var canDrawNode = function(x, y)
    {
	for (var i = 0; i < lNodes.length; ++i)
	{
	    if (lineDistance(x, y, lNodes[i].x, lNodes[i].y) < 2.5 * node_radius)
	    {
		return false;
	    }
	}
	for (var i = 0; i < rNodes.length; ++i)
	{
	    if (lineDistance(x, y, rNodes[i].x, rNodes[i].y) < 2.5 * node_radius)
	    {
		return false;
	    }
	}

	if (x < node_radius || x > canvas.width - node_radius || y < node_radius || y > canvas.height - node_radius)
	{
	    return false;
	}
	if (Math.abs(x - canvas.width/2) < node_radius)
	{
	    return false;
	}
	return true;
    };
    var drawNodes = function()
    {
	for (var i = 0; i < nodes.length; ++i)
	{
	    drawNode(nodes[i].x, nodes[i].y);
	}
    };

    var drawEdges = function ()
    {
	for (var i = 0; i < edges.length; ++i)
	{
	    drawEdge(edges[i].n1, edges[i].n2, edges[i].w);
	}
    };

    var drawNode = function(x, y, color1, color2)
    {
	color1 = typeof color1 !== 'undefined' ? color1 : nodeColor;
	color2 = typeof color2 !== 'undefined' ? color2 : nodeBorderColor;
	context.beginPath();
	context.arc(x, y, node_radius, 0, 2 * Math.PI, false);
	context.fillStyle = color1;
	context.fill();
	context.lineWidth = 2;
	context.strokeStyle = color2;
	context.stroke();
    };

    var drawX = function(x, y)
    {
	context.strokeStyle = 'red';
	context.lineWidth = 1;
	context.beginPath();
	var xLen = 0.8 * node_radius;
	context.moveTo(x-xLen, y-xLen);
	context.lineTo(x+xLen, y+xLen);
	context.stroke();
	context.closePath();
	context.beginPath();
	context.moveTo(x+xLen, y-xLen);
	context.lineTo(x-xLen, y+xLen);
	context.stroke();
	context.closePath();
    };

    var drawEdge = function(i1, i2, weight, color)
    {
	color = typeof color !== 'undefined' ? color : edgeColor;
	var x1 = lNodes[i1].x;
	var y1 = lNodes[i1].y;
	var x2 = rNodes[i2].x;
	var y2 = rNodes[i2].y;
	context.strokeStyle = color;
	context.lineWidth = 5;
	context.beginPath();
	context.moveTo(x1, y1);
	context.lineTo(x2, y2);
	context.stroke();
	context.closePath();

	context.textAlign='center'
	context.font="15px Arial";

	context.beginPath();
	context.strokeStyle = 'white';
	context.lineWidth = 7;
	context.strokeText(weight,(x1+x2)/2,(y1+y2)/2);
	context.stroke();
	context.closePath();

	context.beginPath();
	context.fillStyle = weightColor;
	context.fillText(weight,(x1+x2)/2,(y1+y2)/2);
	context.fill();
	context.closePath();
    };

    var edgeExists = function(in1, in2)
    {
	for (var i = 0; i < edges.length; ++i)
	{
	    if ((edges[i].n1 == in1 && edges[i].n2 == in2) || (edges[i].n1 == in2 && edges[i].n2 == in1))
	    {
		return true;
	    }
	}
	return false;
    };

    var addNode = function(x, y)
    {
	if (onLeft(x,y))
	{
	    lNodes.push({x:x, y:y});
	}
	else
	{
	    rNodes.push({x:x, y:y});
	}
    }
    var removeNode = function(i)
    {
	nodes.splice(i, 1);
	for (var j = edges.length-1; j >= 0; --j)
	{
	    if (edges[j].n1 == i || edges[j].n2 == i)
	    {
		edges.splice(j,1);
	    }
	    else
	    {
		if (edges[j].n1 > i)
		{
		    --edges[j].n1;
		}
		if (edges[j].n2 > i)
		{
		    --edges[j].n2;
		}
	    }
	}
    };
    return {
	init: init,
	stop_draw: stop_draw,
	lNodes: lNodes,
	rNodes: rNodes,
	edges: edges
    };
})();















function lineDistance( x1, y1, x2, y2 )
{
    var xs = 0;
    var ys = 0;

    xs = x2 - x1;
    xs = xs * xs;

    ys = y2 - y1;
    ys = ys * ys;

    return Math.sqrt( xs + ys );
}

function sqr(x) { return x * x }
function dist2(v, w) { return sqr(v.x - w.x) + sqr(v.y - w.y) }
function distToSegmentSquared(p, v, w) {
    var l2 = dist2(v, w);
    if (l2 == 0) return dist2(p, v);
    var t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    if (t < 0) return dist2(p, v);
    if (t > 1) return dist2(p, w);
    return dist2(p, { x: v.x + t * (w.x - v.x),
                      y: v.y + t * (w.y - v.y) });
}
function distToSegment(p, v, w) { return Math.sqrt(distToSegmentSquared(p, v, w)); }
