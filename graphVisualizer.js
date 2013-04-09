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

    function init () {
        console.log("init");
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
        clear_button.onclick = function() {clearCanvas()};

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
            var canDraw = true;
            for (var i = 0; i < nodes.length; ++i)
            {
                if (lineDistance(ev._x, ev._y, nodes[i].x, nodes[i].y) < 2 * node_radius)
                {
                    canDraw = false;
                    break;
                }
            }
            if (canDraw)
            {
                console.log("adding node " + nodes.length);
                drawNode(ev._x, ev._y);
                nodes.push({x: ev._x, y: ev._y});
                img_update();
            }
        };

        this.mousemove = function (ev) {
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
                    console.log("started edge on " + i);
                    this.startNode = i;
                    drawNode(nodes[i].x, nodes[i].y, 'blue');
                    return;
                }
            }
        };

        this.mousemove = function (ev) {
            if (this.startNode == null) {
                return;
            }
            context.clearRect(0, 0, canvas.width, canvas.height);
            drawNode(nodes[this.startNode].x, nodes[this.startNode].y, 'blue')
            for (var i = 0; i < nodes.length; ++i)
            {
                if (lineDistance(ev._x, ev._y, nodes[i].x, nodes[i].y) < 2 * node_radius)
                {
                    if (i != this.startNode)
                    {
                        console.log("moused over node " + i);
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
                drawEdge(this.startNode, this.endNode);
                img_update();
                edges.push({n1: this.startNode, n2: this.endNode});
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

    function drawNodes()
    {
        for (var i = 0; i < nodes.length; ++i)
        {
            drawNode(nodes[i].x, nodes[i].yy);
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
        color1 = typeof color1 !== 'undefined' ? color1 : 'green';
        color2 = typeof color2 !== 'undefined' ? color2 : '#003300';
        context.beginPath();
        context.arc(x, y, node_radius, 0, 2 * Math.PI, false);
        context.fillStyle = color1;
        context.fill();
        context.lineWidth = 4;
        context.strokeStyle = color2;
        context.stroke();
    }

    function drawEdge(i1, i2)
    {
        context.beginPath();
        context.moveTo(nodes[i1].x, nodes[i1].y);
        context.lineTo(nodes[i2].x, nodes[i2].y);
        context.stroke();
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