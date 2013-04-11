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
            clearTempCanvas();
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


    // The line tool.
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
            clearTempCanvas();
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
            drawEdge(edges[i].n1, edges[i].n2);
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

    function drawEdge(i1, i2, weight)
    {
        var x1 = nodes[i1].x;
        var y1 = nodes[i1].y;
        var x2 = nodes[i2].x;
        var y2 = nodes[i2].y;
        context.strokeStyle = edgeColor;
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