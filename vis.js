function Visualization(listener) {
    this.svgW = 500;
    this.svgH = 500;
    this.listener = listener;
}

_.extend(Visualization.prototype, {
    nodeXScale: function (network) {
        return d3.scaleLinear()
            .domain([-0.5, network.layers.length - 0.5])
            .range([0.1 * this.svgW, 0.9 * this.svgW]);
    },

    nodeYScale: function (layer) {
        return d3.scaleLinear()
            .domain([-0.5, layer.nodes.length - 0.5])
            .range([0.1 * this.svgH, 0.9 * this.svgH]);
    },

    drawNetwork: function (network) {
        var self = this;
        var svg = d3.select("svg.network");

        var layerGroups = svg.selectAll("g.layer")
            .data(network.layers);
        layerGroups.enter().append("g")
            .classed("layer", true);
        layerGroups.exit().remove();

        svg.selectAll("g.layer").each(function (layer, layerIndex) {
            var layerGroup = d3.select(this);
            self.drawPlusButton(network, layer, layerIndex, layerGroup);
            self.drawNodeGroup(network, layer, layerIndex, layerGroup);
        });

        svg.style("background-color", "#303030");
    },

    drawPlusButton: function (network, layer, layerIndex, layerGroup) {
        var self = this;
        var plusLength = 10;
        var plusThickness = 1;
        var plusLargeLength = 13;
        var plusLargeThickness = 1.3;

        drawRect("horizontal", plusLength, plusThickness);
        drawRect("vertical", plusThickness, plusLength);
        drawRect("bg", plusLargeLength, plusLargeLength)
            .attr("opacity", 0)
            .on("click", function () {
                layer.addNode();
                self.drawNetwork(network);
                self.listener();
            })
            .on("mouseover", function () {
                drawRect("horizontal", plusLargeLength, plusLargeThickness);
                drawRect("vertical", plusLargeThickness, plusLargeLength);
                $(document.body).css("cursor", "pointer");
            })
            .on("mouseout", function () {
                drawRect("horizontal", plusLength, plusThickness);
                drawRect("vertical", plusThickness, plusLength);
                $(document.body).css("cursor", "default");
            });

        function drawRect(rectClass, w, h) {
            var xScale = self.nodeXScale(network);
            var plusX = xScale(layerIndex);
            var plusY = 0.05 * self.svgH;
            var trans = d3.transition()
                .duration(100);

            var rect = layerGroup.select("rect.plus." + rectClass);
            if (rect.empty()) {
                rect = layerGroup.append("rect")
                    .classed("plus", true)
                    .classed(rectClass, true);
            }
            rect.transition(trans)
                .attr("x", plusX - w / 2)
                .attr("y", plusY - h / 2)
                .attr("width", w)
                .attr("height", h);
            return rect;
        }
    },

    drawNodeGroup: function (network, layer, layerIndex, layerGroup) {
        var self = this;
        var xScale = self.nodeXScale(network);
        var yScale = self.nodeYScale(layer);
        var trans = d3.transition()
            .duration(1000);

        var nodeGroups = layerGroup.selectAll("g.node")
            .data(layer.nodes);
        nodeGroups.enter().append("g")
            .classed("node", true);
        nodeGroups.exit().remove();

        layerGroup.selectAll("g.node")
            .each(function (node, nodeIndex) {
                var nodeGroup = d3.select(this);
                var nodeX = xScale(layerIndex);
                var nodeY = yScale(nodeIndex);

                var succLayer = layer.successor();
                if (succLayer) {
                    var succYScale = self.nodeYScale(succLayer);

                    var edgePaths = nodeGroup.selectAll("path.edge")
                        .data(node.weights);
                    edgePaths.enter().append("path")
                        .classed("edge", true)
                        .attr("opacity", 0);
                    edgePaths.exit().remove();

                    nodeGroup.selectAll("path.edge")
                        .each(function (weight, weightIndex) {
                            var succNodeX = xScale(layerIndex + 1);
                            var succNodeY = succYScale(weightIndex);

                            var edgePath = d3.path();
                            edgePath.moveTo(succNodeX, succNodeY);
                            edgePath.lineTo(nodeX, nodeY);
                            edgePath.closePath();

                            d3.select(this)
                                .classed("zero", weight === 0)
                                .transition(trans)
                                .attr("opacity", 1)
                                .attr("d", edgePath.toString());
                        });
                }

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
                    .attr("opacity", 1)
                    .attr("cx", nodeX)
                    .attr("cy", nodeY);

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
                    .text(node.id)
                    .attr("opacity", 1)
                    .attr("x", nodeX)
                    .attr("y", nodeY);
            });
    },
});
