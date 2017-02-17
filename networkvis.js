var NetworkTransition = { normal: 800, none: 0 };

function NetworkVis(network, listener) {
    this.svgW = 400;
    this.svgH = 500;
    this.network = network;
    this.listener = listener;
    this.buttonsEnabled = true;
}

_.extend(NetworkVis.prototype, {
    enableButtons: function () {
        this.buttonsEnabled = true;
    },

    disableButtons: function () {
        this.buttonsEnabled = false;
    },

    getTransition: function (networkTrans) {
        return d3.transition()
            .duration(networkTrans);
    },

    getLayerXScale: function () {
        return d3.scaleLinear()
            .domain([-0.5, this.network.layers.length - 0.5])
            .range([0.1 * this.svgW, 0.9 * this.svgW]);
    },

    getNodeYScale: function (layer) {
        return d3.scaleLinear()
            .domain([-0.5, layer.nodes.length - 0.5])
            .range([0.1 * this.svgH, 0.9 * this.svgH]);
    },

    draw: function (networkTrans) {
        var self = this;
        var svg = d3.select("svg.network");
        var trans = d3.transition()
            .duration(networkTrans);

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
                self.drawNodeGroup(layer, layerIndex, layerGroup, trans);
                self.drawNodeButtons(layer, layerIndex, layerGroup);
            });
    },

    drawNodeGroup: function (layer, layerIndex, layerGroup, trans) {
        var self = this;
        var layerExiting = layer.index !== layerIndex;
        var xScale = self.getLayerXScale();
        var yScale = self.getNodeYScale(layer);

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

                self.drawEdgeGroup(layer, layerIndex, node, nodeGroup, trans, xScale, nodeX, nodeY, opacity);

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

    drawEdgeGroup: function (layer, layerIndex, node, nodeGroup, trans, xScale, nodeX, nodeY, opacity) {
        var self = this;
        var predLayer = layer.getPredecessor() || layer;
        var predLayerExiting = predLayer === layer;
        var predYScale = self.getNodeYScale(predLayer);

        var edgeGroups = nodeGroup.selectAll("g.edge")
            .data(node.weights);
        edgeGroups.enter()
            .append("g")
            .classed("edge", true);
        edgeGroups.exit()
            .transition(trans)
            .remove();

        nodeGroup.selectAll("g.edge")
            .each(function (weight, weightIndex) {
                if (weightIndex === 0) {
                    return;
                }
                var edgeGroup = d3.select(this);
                var predNodeIndex = weightIndex - 1;
                var predNodeX = xScale(layerIndex - 1 + (predLayerExiting ? 1 : 0));
                var predNodeY = predYScale(Math.min(predNodeIndex, predLayer.nodes.length - 1));

                var path = d3.path();
                path.moveTo(predNodeX, predNodeY);
                path.lineTo(nodeX, nodeY);
                path.closePath();

                var edgePath = edgeGroup.select("path.edge");
                if (edgePath.empty()) {
                    edgePath = edgeGroup.append("path")
                        .classed("edge", true)
                        .attr("opacity", 0);
                }
                edgePath.transition(trans)
                    .attr("opacity", opacity)
                    .attr("d", path.toString());

                var prop = (layer.nodes.length === 1 || 
                    predLayer.nodes.length === 1 || 
                    Math.abs(nodeY - predNodeY) < 2) ? 0.5 : 0.7;
                var textX = prop * nodeX + (1 - prop) * predNodeX;
                var textY = prop * nodeY + (1 - prop) * predNodeY;
                var textDy = Math.abs(nodeY - predNodeY) < 2 ? -4 : 2.5;

                var edgeText = edgeGroup.select("text.edge");
                if (edgeText.empty()) {
                    edgeText = edgeGroup.append("text")
                        .classed("edge", true)
                        .attr("opacity", 0)
                        .attr("dy", textDy)
                        .attr("x", textX)
                        .attr("y", textY);
                }
                edgeText.transition(trans)
                    .text(weight.toFixed(2))
                    .attr("opacity", opacity)
                    .attr("dy", textDy)
                    .attr("x", textX)
                    .attr("y", textY)
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
            return layer.nodes.length < Expression.symbols.length && self.buttonsEnabled;
        };

        self.drawRect(layerGroup, "plus-h", plusX, plusY, length, thickness, plusEnabled())
        self.drawRect(layerGroup, "plus-v", plusX, plusY, thickness, length, plusEnabled())
        self.drawRect(layerGroup, "plus-bg", plusX, plusY, largeLength, largeLength, plusEnabled())
            .attr("opacity", 0)
            .on("click", function () {
                layer.addNode();
                self.draw(NetworkTransition.normal);
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
            return layer.nodes.length > 1 && self.buttonsEnabled;
        };

        self.drawRect(layerGroup, "minus-h", minusX, minusY, length, thickness, minusEnabled())
        self.drawRect(layerGroup, "minus-bg", minusX, minusY, largeLength, largeLength, minusEnabled())
            .attr("opacity", 0)
            .on("click", function () {
                layer.removeNode();
                self.draw(NetworkTransition.normal);
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
        var plusX = xScale(self.network.layers.length - 1) + 25;
        var plusY = self.svgH / 2;

        var plusEnabled = function () {
            return self.network.layers.length < 10 && self.buttonsEnabled;
        };

        self.drawRect(svg, "plus-h", plusX, plusY, length, thickness, plusEnabled())
        self.drawRect(svg, "plus-v", plusX, plusY, thickness, length, plusEnabled())
        self.drawRect(svg, "plus-bg", plusX, plusY, largeLength, largeLength, plusEnabled())
            .attr("opacity", 0)
            .on("click", function () {
                self.network.addHiddenLayer();
                self.draw(NetworkTransition.normal);
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

        var minusX = plusX + (plusEnabled() ? 20 : 0);
        var minusY = plusY;

        var minusEnabled = function () {
            return self.network.layers.length > 2 && self.buttonsEnabled;
        };

        self.drawRect(svg, "minus-h", minusX, minusY, length, thickness, minusEnabled())
        self.drawRect(svg, "minus-bg", minusX, minusY, largeLength, largeLength, minusEnabled())
            .attr("opacity", 0)
            .on("click", function () {
                self.network.removeHiddenLayer();
                self.draw(NetworkTransition.normal);
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
            .duration(200);

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
