if(window.addEventListener) {
    window.addEventListener('load', mainLoop, false);
}


function mainLoop() {
    var canvas, context, canvaso, contexto;

    // The active tool instance.
    var tool;
    var tool_default = 'node';

    var nodes = [];
    var node_radius = 20;

    var edges = [];

    var nodeColor = 'green';
    var nodeHighlightColor = 'blue';
    var nodeBorderColor = '#003300'

    var edgeColor = 'black';

    var weightColor = 'blue';

    function init () {
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
            nodes = [];
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
    }

    // The general-purpose event handler. This function just determines the mouse
    // position relative to the canvas element.
    function ev_canvas (ev) {
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
    }

    // The event handler for any changes made to the tool selector.
    function ev_tool_change (ev) {
        if (tools[this.value]) {
            tool = new tools[this.value]();
        }
    }

    // This function draws the #imageTemp canvas on top of #imageView, after which
    // #imageTemp is cleared. This function is called each time when the user
    // completes a drawing operation.
    function img_update () {
	contexto.drawImage(canvas, 0, 0);
	context.clearRect(0, 0, canvas.width, canvas.height);
    }

    // This object holds the implementation of each drawing tool.
    var tools = {};

    // The node tool.
    tools.node = function () {
        this.mousedown = function (ev) {
            if (canDrawNode(ev._x, ev._y))
            {
                drawNode(ev._x, ev._y);
                nodes.push({x: ev._x, y: ev._y});
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
        this.startNode = null;
        this.endNode = null;
        this.mousedown = function (ev) {
            for (var i = 0; i < nodes.length; ++i)
            {
                if (lineDistance(ev._x, ev._y, nodes[i].x, nodes[i].y) < node_radius)
                {
                    this.startNode = i;
                    drawNode(nodes[i].x, nodes[i].y, nodeHighlightColor);
                    return;
                }
            }
        };

        this.mousemove = function (ev) {
            this.endNode = null;
            if (this.startNode == null) {
                return;
            }
            drawNode(nodes[this.startNode].x, nodes[this.startNode].y, 'blue');
            for (var i = 0; i < nodes.length; ++i)
            {
                if (lineDistance(ev._x, ev._y, nodes[i].x, nodes[i].y) < 2 * node_radius)
                {
                    if (i != this.startNode)
                    {
                        drawNode(nodes[i].x, nodes[i].y, 'blue');
                        this.endNode = i;
                    }
                    break;
                }
            }
            context.beginPath();
            context.moveTo(nodes[this.startNode].x, nodes[this.startNode].y);
            context.lineTo(ev._x, ev._y);
            context.stroke();
            context.closePath();
        };

        this.mouseup = function (ev) {
            context.clearRect(0, 0, canvas.width, canvas.height);
            if (this.startNode == null || this.endNode == null)
            {
                this.startNode = null;
                this.endNode = null;
                return;
            }
            if (!edgeExists(this.startNode, this.endNode))
            {
                var weight = parseFloat(prompt("Edge Weight",0));
                while (isNaN(weight))
                {
                    weight = parseFloat(prompt("Please enter a valid float value", 0));
                }
                drawEdge(this.startNode, this.endNode, weight);
                img_update();
                edges.push({n1: this.startNode, n2: this.endNode, w: weight});
            }
            this.startNode = null;
            this.endNode = null;
        };
    };




    // The eraser tool.
    tools.eraser = function () {
        this.mousedown = function (ev) {
            for (var i = 0; i < nodes.length; ++i)
            {
                if (lineDistance(ev._x, ev._y, nodes[i].x, nodes[i].y) < node_radius)
                {
                    removeNode(i);
                    clearCanvas();
                    drawNodes();
                    drawEdges();
                    img_update();
                    return;
                }
            }
            for (var i = 0; i < edges.length; ++i)
            {
                if (distToSegment({x: ev._x, y:ev._y}, nodes[edges[i].n1], nodes[edges[i].n2]) < node_radius)
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
                if (lineDistance(ev._x, ev._y, nodes[i].x, nodes[i].y) < node_radius)
                {
                    drawNode(nodes[i].x, nodes[i].y, '#aa0000', '#440000');
                    return;
                }
            }
            for (var i = 0; i < edges.length; ++i)
            {
                if (distToSegment({x: ev._x, y:ev._y}, nodes[edges[i].n1], nodes[edges[i].n2]) < node_radius)
                {
                    drawEdge(edges[i].n1, edges[i].n2, edges[i].w, 'red');
                    return;
                }
            }
        };

        this.mouseup = function (ev) {
        };
    };













    function clearTempCanvas()
    {
	context.clearRect(0, 0, canvas.width, canvas.height);
    }
    function clearCanvas()
    {
	contexto.clearRect(0, 0, canvaso.width, canvaso.height);
    }

    function canDrawNode(x, y)
    {
        for (var i = 0; i < nodes.length; ++i)
        {
            if (lineDistance(x, y, nodes[i].x, nodes[i].y) < 2.5 * node_radius)
            {
                return false;
            }
        }
        if (x < node_radius || x > canvas.width - node_radius || y < node_radius || y > canvas.height - node_radius)
        {
            return false;
        }
        return true;
    }
    function drawNodes()
    {
        for (var i = 0; i < nodes.length; ++i)
        {
            drawNode(nodes[i].x, nodes[i].y);
        }
    }

    function drawEdges()
    {
        for (var i = 0; i < edges.length; ++i)
        {
            drawEdge(edges[i].n1, edges[i].n2, edges[i].w);
        }
    }

    function drawNode(x, y, color1, color2)
    {
        color1 = typeof color1 !== 'undefined' ? color1 : nodeColor;
        color2 = typeof color2 !== 'undefined' ? color2 : nodeBorderColor;
        context.beginPath();
        context.arc(x, y, node_radius, 0, 2 * Math.PI, false);
        context.fillStyle = color1;
        context.fill();
        context.lineWidth = 4;
        context.strokeStyle = color2;
        context.stroke();
    }

    function drawX(x, y)
    {
        context.strokeStyle = 'red';
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
    }

    function drawEdge(i1, i2, weight, color)
    {
        color = typeof color !== 'undefined' ? color : edgeColor;
        var x1 = nodes[i1].x;
        var y1 = nodes[i1].y;
        var x2 = nodes[i2].x;
        var y2 = nodes[i2].y;
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
    }

    function edgeExists(in1, in2)
    {
        for (var i = 0; i < edges.length; ++i)
        {
            if ((edges[i].n1 == in1 && edges[i].n2 == in2) || (edges[i].n1 == in2 && edges[i].n2 == in1))
            {
                return true;
            }
        }
        return false;
    }

    function removeNode(i)
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
        return;
    }

    init();
}


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