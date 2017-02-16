function NetworkVis(network, listener) {
    this.svgW = 400;
    this.svgH = 500;
    this.network = network;
    this.listener = listener;
}

_.extend(NetworkVis.prototype, {
    nodeXScale: function () {
        return d3.scaleLinear()
            .domain([-0.5, this.network.layers.length - 0.5])
            .range([0.05 * this.svgW, 0.95 * this.svgW]);
    },

    nodeYScale: function (layer) {
        return d3.scaleLinear()
            .domain([-0.5, layer.nodes.length - 0.5])
            .range([0.1 * this.svgH, 0.9 * this.svgH]);
    },

    draw: function () {
        var self = this;
        var svg = d3.select("svg.network");

        var layerGroups = svg.selectAll("g.layer")
            .data(this.network.layers);
        layerGroups.enter().append("g")
            .classed("layer", true);
        layerGroups.exit().remove();

        svg.selectAll("g.layer").each(function (layer, layerIndex) {
            var layerGroup = d3.select(this);
            self.drawMinusButton(layer, layerIndex, layerGroup);
            self.drawPlusButton(layer, layerIndex, layerGroup);
            self.drawNodeGroup(layer, layerIndex, layerGroup);
        });
    },

    drawMinusButton: function (layer, layerIndex, layerGroup) {
        var self = this;
        var length = 10;
        var thickness = 1;
        var largeLength = 15;
        var largeThickness = 1.5;
        var xScale = self.nodeXScale();
        var yScale = self.nodeYScale(layer);
        var x = xScale(layerIndex);
        var y = yScale(layer.nodes.length - 1) + 45;

        var enabled = function () {
            return layer.nodes.length > 1;
        };

        self.drawRect(layerGroup, "minus-h", x, y, length, thickness, enabled())
        self.drawRect(layerGroup, "minus-bg", x, y, largeLength, largeLength, enabled())
            .attr("opacity", 0)
            .on("click", function () {
                layer.removeNode();
                self.draw();
                self.listener();
            })
            .on("mouseover", function () {
                self.drawRect(layerGroup, "minus-h", x, y, largeLength, largeThickness, enabled());
            })
            .on("mouseout", function () {
                self.drawRect(layerGroup, "minus-h", x, y, length, thickness, enabled());
            });
    },

    drawPlusButton: function (layer, layerIndex, layerGroup) {
        var self = this;
        var length = 10;
        var thickness = 1;
        var largeLength = 15;
        var largeThickness = 1.5;
        var xScale = self.nodeXScale();
        var yScale = self.nodeYScale(layer);
        var x = xScale(layerIndex);
        var y = yScale(layer.nodes.length - 1) + 25;

        var enabled = function () {
            return layer.nodes.length < Expression.symbols.length;
        };

        self.drawRect(layerGroup, "plus-h", x, y, length, thickness, enabled())
        self.drawRect(layerGroup, "plus-v", x, y, thickness, length, enabled())
        self.drawRect(layerGroup, "plus-bg", x, y, largeLength, largeLength, enabled())
            .attr("opacity", 0)
            .on("click", function () {
                layer.addNode();
                self.draw();
                self.listener();
            })
            .on("mouseover", function () {
                self.drawRect(layerGroup, "plus-h", x, y, largeLength, largeThickness, enabled());
                self.drawRect(layerGroup, "plus-v", x, y, largeThickness, largeLength, enabled());
            })
            .on("mouseout", function () {
                self.drawRect(layerGroup, "plus-h", x, y, length, thickness, enabled());
                self.drawRect(layerGroup, "plus-v", x, y, thickness, length, enabled());
            });
    },

    drawRect: function (layerGroup, rectClass, x, y, w, h, enabled) {
        var trans = d3.transition()
            .duration(400);

        var rect = layerGroup.select("rect." + rectClass);
        if (rect.empty()) {
            rect = layerGroup.append("rect")
                .classed("button", true)
                .classed(rectClass, true);
        }
        rect.transition(trans)
            .attr("visibility", enabled ? "visible" : "hidden")
            .attr("width", w)
            .attr("height", h)
            .attr("x", x - w / 2)
            .attr("y", y - h / 2);
        return rect;
    },

    drawNodeGroup: function (layer, layerIndex, layerGroup) {
        var self = this;
        var xScale = self.nodeXScale();
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

                var text =
                    !layer.successor()   ? "F" + (nodeIndex + 1) :
                    !layer.predecessor() ? Expression.symbols[nodeIndex] :
                                           "";

                if (text) {
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
                        .attr("opacity", 1)
                        .attr("x", nodeX)
                        .attr("y", nodeY);
                }
            });
    },
});

var PlotType = { Actual: "actual", Estimated: "estimated" };

function GraphVis() {
    this.svgW = 400;
    this.svgH = 300;
}

_.extend(GraphVis.prototype, {
    plotLength: function (dataForOutputs) {
        return 0.8 * Math.min(
            this.svgW / dataForOutputs[0].length,
            this.svgH / dataForOutputs.length);
    },

    plotXScale: function (dataForOutputs) {
        var centerX = this.svgW / 2;
        var halfWidth = this.plotLength(dataForOutputs) * dataForOutputs[0].length / 2;
        return d3.scaleLinear()
            .domain([0, dataForOutputs[0].length])
            .range([centerX - halfWidth, centerX + halfWidth]);
    },

    plotYScale: function (dataForOutputs) {
        var centerY = this.svgH / 2;
        var halfHeight = this.plotLength(dataForOutputs) * dataForOutputs.length / 2;
        return d3.scaleLinear()
            .domain([0, dataForOutputs.length])
            .range([centerY - halfHeight, centerY + halfHeight]);
    },

    draw: function (dataForOutputs, plotType) {
        var self = this;
        var svg = d3.select("svg.graph");
        var xScale = self.plotXScale(dataForOutputs);
        var yScale = self.plotYScale(dataForOutputs);
        var plotLength = self.plotLength(dataForOutputs);
        var trans = d3.transition()
            .duration(1000);

        var outputGroups = svg.selectAll("g.output")
            .data(dataForOutputs);
        outputGroups.enter().append("g")
            .classed("output", true);
        outputGroups.exit().remove();

        svg.selectAll("g.output")
            .each(function (dataForInputs, outputIndex) {
                var outputGroup = d3.select(this);

                var outputTextX = xScale(0) - 20;
                var outputTextY = yScale(outputIndex + 0.5);

                var outputText = outputGroup.select("text.output");
                if (outputText.empty()) {
                    outputText = outputGroup.append("text")
                        .classed("output", true)
                        .attr("opacity", 0)
                        .text("F" + (outputIndex + 1))
                        .attr("dy", 3)
                        .attr("x", outputTextX)
                        .attr("y", outputTextY);
                }
                outputText.raise()
                    .transition(trans)
                    .attr("opacity", 1)
                    .attr("x", outputTextX)
                    .attr("y", outputTextY);

                var inputGroups = outputGroup.selectAll("g.input")
                    .data(dataForInputs);
                inputGroups.enter().append("g")
                    .classed("input", true);
                inputGroups.exit().remove();

                outputGroup.selectAll("g.input")
                    .each(function (dataForPlots, inputIndex) {
                        var inputGroup = d3.select(this);
                        var plotX = xScale(inputIndex);
                        var plotY = yScale(outputIndex);

                        self.drawSinglePlot(svg, plotType, dataForPlots, inputGroup, plotX, plotY, plotLength, trans);

                        if (outputIndex === 0) {
                            var inputTextX = xScale(inputIndex + 0.5);
                            var inputTextY = yScale(dataForOutputs.length) + 5;

                            var inputText = inputGroup.select("text.input");
                            if (inputText.empty()) {
                                inputText = inputGroup.append("text")
                                    .classed("input", true)
                                    .attr("opacity", 0)
                                    .text(Expression.symbols[inputIndex])
                                    .attr("dy", 3)
                                    .attr("x", inputTextX)
                                    .attr("y", inputTextY);
                            }
                            inputText.raise()
                                .transition(trans)
                                .attr("opacity", 1)
                                .attr("x", inputTextX)
                                .attr("y", inputTextY);
                        }
                    });
            });
    },

    drawSinglePlot: function (svg, plotType, dataForPlots, inputGroup, plotX, plotY, plotLength, trans) {
        var self = this;
        var plotWidth = 0.9 * plotLength;
        var plotHeight = 0.9 * plotLength;
        var plotTransform = "translate(" + plotX + ", " + plotY + ")";

        var plotRect = inputGroup.select("rect.plot");
        if (plotRect.empty()) {
            plotRect = inputGroup.append("rect")
                .classed("plot", true)
                .attr("opacity", 0)
                .attr("x", plotX)
                .attr("y", plotY)
                .attr("width", plotWidth)
                .attr("height", plotHeight);
        }
        plotRect.transition(trans)
            .attr("opacity", 1)
            .attr("x", plotX)
            .attr("y", plotY)
            .attr("width", plotWidth)
            .attr("height", plotHeight);

        var svgDefs = svg.select("defs");
        if (svgDefs.empty()) {
            svgDefs = svg.append("defs");
        }

        var clipPathUrl = "plot-clip-path";
        var clipPath = svgDefs.select("#" + clipPathUrl);
        if (clipPath.empty()) {
            clipPath = svgDefs.append("clipPath")
                .attr("id", clipPathUrl);
        }

        var clipPathRect = clipPath.select("rect");
        if (clipPathRect.empty()) {
            clipPathRect = clipPath.append("rect")
                .attr("x", 0)
                .attr("y", 0)
                .attr("width", plotWidth)
                .attr("height", plotHeight);
        }
        clipPathRect.transition(trans)
            .attr("width", plotWidth)
            .attr("height", plotHeight);

        var plotGroup = inputGroup.select("g.plot-" + plotType);
        if (plotGroup.empty()) {
            plotGroup = inputGroup.append("g")
                .classed("plot-" + plotType, true)
                .attr("clip-path", "url(#" + clipPathUrl + ")")
                .attr("transform", plotTransform);
        }
        plotGroup.transition(trans)
            .attr("transform", plotTransform)

        var domainInterval = [
            _.first(dataForPlots.domain),
            _.last(dataForPlots.domain),
        ];
        var domainWidth = domainInterval[1] - domainInterval[0];
        var rangeInterval = [
            dataForPlots.median - domainWidth / 2, 
            dataForPlots.median + domainWidth / 2,
        ];
        var xScale = d3.scaleLinear()
            .domain(domainInterval)
            .range([0, plotWidth]);
        var yScale = d3.scaleLinear()
            .domain(rangeInterval)
            .range([plotHeight, 0]);

        var plotPaths = plotGroup.selectAll("path.plot")
            .data(dataForPlots.range);
        plotPaths.enter().append("path")
            .classed("plot", true);
        plotPaths.exit().remove();

        plotGroup.selectAll("path.plot")
            .each(function (y1, i) {
                var x1 = dataForPlots.domain[i];
                var x2 = dataForPlots.domain[i + 1];
                var y2 = dataForPlots.range[i + 1];

                if (x1 === undefined || x2 === undefined || 
                    y1 === undefined || y2 === undefined ||
                    math.distance([x1, y1], [x2, y2]) > domainWidth
                ) {
                    d3.select(this).attr("opacity", 0);
                    return;
                }

                var plotPath = d3.path();
                plotPath.moveTo(xScale(x1), yScale(y1));
                plotPath.lineTo(xScale(x2), yScale(y2));
                plotPath.closePath();

                d3.select(this)
                    .classed(plotType, true)
                    .transition(trans)
                    .attr("opacity", 1)
                    .attr("d", plotPath.toString());
            });
    },
});