function NetworkVis(network, listener) {
    this.svgW = 400;
    this.svgH = 500;
    this.network = network;
    this.listener = listener;
}

_.extend(NetworkVis.prototype, {
    getLayerXScale: function () {
        return d3.scaleLinear()
            .domain([-0.5, this.network.layers.length - 0.5])
            .range([0.05 * this.svgW, 0.95 * this.svgW]);
    },

    getNodeYScale: function (layer) {
        return d3.scaleLinear()
            .domain([-0.5, layer.nodes.length - 0.5])
            .range([0.1 * this.svgH, 0.9 * this.svgH]);
    },

    draw: function () {
        var self = this;
        var svg = d3.select("svg.network");
        var trans = d3.transition()
            .duration(800);

        self.drawLayerButtons(svg);

        var layerGroups = svg.selectAll("g.layer")
            .data(this.network.layers.slice().reverse());
        layerGroups.enter()
            .append("g")
            .classed("layer", true);
        layerGroups.exit()
            .transition(trans)
            .remove();

        svg.selectAll("g.layer")
            .each(function (layer, reversedIndex) {
                var layerIndex = self.network.layers.length - reversedIndex - 1;
                var layerGroup = d3.select(this);
                self.drawNodeGroup(layer, layerIndex, layerGroup);
                self.drawNodeButtons(layer, layerIndex, layerGroup);
            });
    },

    drawNodeGroup: function (layer, layerIndex, layerGroup) {
        var self = this;
        var layerExiting = layer.index !== layerIndex;
        var xScale = self.getLayerXScale();
        var yScale = self.getNodeYScale(layer);
        var trans = d3.transition()
            .duration(800);

        var nodeGroups = layerGroup.selectAll("g.node")
            .data(layer.nodes);
        nodeGroups.enter()
            .append("g")
            .classed("node", true);
        nodeGroups.exit()
            .transition(trans)
            .remove();

        layerGroup.selectAll("g.node")
            .each(function (node, nodeIndex) {
                var nodeGroup = d3.select(this);
                var nodeExiting = nodeIndex >= layer.nodes.length || layerExiting;
                var nodeX = xScale(layerIndex + (layerExiting ? 1 : 0));
                var nodeY = yScale(Math.min(nodeIndex, layer.nodes.length - 1));
                var opacity = nodeExiting ? 0 : 1;

                var predLayer = layer.getPredecessor() || layer;
                var predLayerExiting = predLayer === layer;
                var predYScale = self.getNodeYScale(predLayer);

                var edgePaths = nodeGroup.selectAll("path.edge")
                    .data(node.weights);
                edgePaths.enter()
                    .append("path")
                    .classed("edge", true)
                    .attr("opacity", 0);
                edgePaths.exit()
                    .transition(trans)
                    .attr("opacity", 0)
                    .remove();

                nodeGroup.selectAll("path.edge")
                    .each(function (weight, weightIndex) {
                        if (weightIndex === 0) {
                            return;
                        }
                        var predNodeIndex = weightIndex - 1;
                        var predNodeX = xScale(layerIndex - 1 + (predLayerExiting ? 1 : 0));
                        var predNodeY = predYScale(Math.min(predNodeIndex, predLayer.nodes.length - 1));

                        var edgePath = d3.path();
                        edgePath.moveTo(predNodeX, predNodeY);
                        edgePath.lineTo(nodeX, nodeY);
                        edgePath.closePath();

                        d3.select(this)
                            .transition(trans)
                            .attr("opacity", opacity)
                            .attr("d", edgePath.toString());
                    });

                var nodeCircle = nodeGroup.select("circle.node");
                if (nodeCircle.empty()) {
                    nodeCircle = nodeGroup.append("circle")
                        .classed("node", true)
                        .attr("opacity", 0)
                        .attr("r", 10)
                        .attr("cx", nodeX)
                        .attr("cy", nodeY);
                }
                nodeCircle.raise()
                    .transition(trans)
                    .attr("opacity", opacity)
                    .attr("cx", nodeX)
                    .attr("cy", nodeY);

                var text = layer.isOutput() ? "F" + (nodeIndex + 1) :
                           layer.isInput()  ? Expression.symbols[nodeIndex] :
                                              "";

                var nodeText = nodeGroup.select("text.node");
                if (nodeText.empty()) {
                    nodeText = nodeGroup.append("text")
                        .classed("node", true)
                        .attr("opacity", 0)
                        .attr("dy", 3)
                        .attr("x", nodeX)
                        .attr("y", nodeY);
                }
                nodeText.raise()
                    .transition(trans)
                    .text(text)
                    .attr("opacity", opacity)
                    .attr("x", nodeX)
                    .attr("y", nodeY);
            });
    },

    drawNodeButtons: function (layer, layerIndex, layerGroup) {
        var self = this;
        var length = 10;
        var thickness = 1;
        var largeLength = 15;
        var largeThickness = 1.5;
        var layerExiting = layer.index !== layerIndex;
        var xScale = self.getLayerXScale();
        var yScale = self.getNodeYScale(layer);
        var plusX = xScale(layerIndex + (layerExiting ? 1 : 0));
        var plusY = yScale(layer.nodes.length - 1) + 25;

        var plusEnabled = function () {
            return layer.nodes.length < Expression.symbols.length;
        };

        self.drawRect(layerGroup, "plus-h", plusX, plusY, length, thickness, plusEnabled())
        self.drawRect(layerGroup, "plus-v", plusX, plusY, thickness, length, plusEnabled())
        self.drawRect(layerGroup, "plus-bg", plusX, plusY, largeLength, largeLength, plusEnabled())
            .attr("opacity", 0)
            .on("click", function () {
                layer.addNode();
                self.draw();
                self.listener();
            })
            .on("mouseover", function () {
                self.drawRect(layerGroup, "plus-h", plusX, plusY, largeLength, largeThickness, plusEnabled());
                self.drawRect(layerGroup, "plus-v", plusX, plusY, largeThickness, largeLength, plusEnabled());
            })
            .on("mouseout", function () {
                self.drawRect(layerGroup, "plus-h", plusX, plusY, length, thickness, plusEnabled());
                self.drawRect(layerGroup, "plus-v", plusX, plusY, thickness, length, plusEnabled());
            });

        var minusX = plusX;
        var minusY = plusY + (plusEnabled() ? 20 : 0);

        var minusEnabled = function () {
            return layer.nodes.length > 1;
        };

        self.drawRect(layerGroup, "minus-h", minusX, minusY, length, thickness, minusEnabled())
        self.drawRect(layerGroup, "minus-bg", minusX, minusY, largeLength, largeLength, minusEnabled())
            .attr("opacity", 0)
            .on("click", function () {
                layer.removeNode();
                self.draw();
                self.listener();
            })
            .on("mouseover", function () {
                self.drawRect(layerGroup, "minus-h", minusX, minusY, largeLength, largeThickness, minusEnabled());
            })
            .on("mouseout", function () {
                self.drawRect(layerGroup, "minus-h", minusX, minusY, length, thickness, minusEnabled());
            });
    },

    drawLayerButtons: function (svg) {
        var self = this;
        var length = 10;
        var thickness = 1;
        var largeLength = 15;
        var largeThickness = 1.5;
        var xScale = self.getLayerXScale();
        var plusX = xScale(self.network.layers.length - 1) + 100;
        var plusY = self.svgH / 2;

        var plusEnabled = function () {
            return self.network.layers.length < 10;
        };

        self.drawRect(svg, "plus-h", plusX, plusY, length, thickness, plusEnabled())
        self.drawRect(svg, "plus-v", plusX, plusY, thickness, length, plusEnabled())
        self.drawRect(svg, "plus-bg", plusX, plusY, largeLength, largeLength, plusEnabled())
            .attr("opacity", 0)
            .on("click", function () {
                self.network.addHiddenLayer();
                self.draw();
                self.listener();
            })
            .on("mouseover", function () {
                self.drawRect(svg, "plus-h", plusX, plusY, largeLength, largeThickness, plusEnabled());
                self.drawRect(svg, "plus-v", plusX, plusY, largeThickness, largeLength, plusEnabled());
            })
            .on("mouseout", function () {
                self.drawRect(svg, "plus-h", plusX, plusY, length, thickness, plusEnabled());
                self.drawRect(svg, "plus-v", plusX, plusY, thickness, length, plusEnabled());
            });

        var minusX = plusX;
        var minusY = plusY + (plusEnabled() ? 20 : 0);

        var minusEnabled = function () {
            return self.network.layers.length > 2;
        };

        self.drawRect(svg, "minus-h", minusX, minusY, length, thickness, minusEnabled())
        self.drawRect(svg, "minus-bg", minusX, minusY, largeLength, largeLength, minusEnabled())
            .attr("opacity", 0)
            .on("click", function () {
                self.network.removeHiddenLayer();
                self.draw();
                self.listener();
            })
            .on("mouseover", function () {
                self.drawRect(svg, "minus-h", minusX, minusY, largeLength, largeThickness, minusEnabled());
            })
            .on("mouseout", function () {
                self.drawRect(svg, "minus-h", minusX, minusY, length, thickness, minusEnabled());
            });
    },

    drawRect: function (parent, rectClass, x, y, w, h, enabled) {
        var trans = d3.transition()
            .duration(400);

        var rect = parent.select("rect." + rectClass);
        if (rect.empty()) {
            rect = parent.append("rect")
                .classed("button", true)
                .classed(rectClass, true)
                .attr("x", x - w / 2)
                .attr("y", y - h / 2);
        }
        rect.transition(trans)
            .attr("visibility", enabled ? "visible" : "hidden")
            .attr("width", w)
            .attr("height", h)
            .attr("x", x - w / 2)
            .attr("y", y - h / 2);
        return rect;
    },
});
