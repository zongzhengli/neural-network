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
            .range([0.1 * this.svgH, 0.95 * this.svgH]);
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
            self.drawPlusButton(layer, layerIndex, layerGroup);
            self.drawNodeGroup(layer, layerIndex, layerGroup);
        });
    },

    drawPlusButton: function (layer, layerIndex, layerGroup) {
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
                self.draw();
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
            var xScale = self.nodeXScale();
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

    draw: function (dataForOutputs) {
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
                        var plotId = outputIndex + "-" + inputIndex;
                        var plotX = xScale(inputIndex);
                        var plotY = yScale(outputIndex);

                        self.drawSinglePlot(svg, dataForPlots, inputGroup, plotId, plotX, plotY, plotLength, trans);

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

    drawSinglePlot: function (svg, dataForPlots, inputGroup, plotId, plotX, plotY, plotLength, trans) {
        var self = this;
        var plotWidth = 0.9 * plotLength;
        var plotHeight = 0.9 * plotLength;

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

        var clipPathUrl = "plot-clip-path-" + plotId;
        var clipPath = svgDefs.select("#" + clipPathUrl);
        if (clipPath.empty()) {
            clipPath = svgDefs.append("clipPath")
                .attr("id", clipPathUrl);
        }

        var clipPathRect = clipPath.select("rect");
        if (clipPathRect.empty()) {
            clipPathRect = clipPath.append("rect")
                .attr("x", plotX)
                .attr("y", plotY)
                .attr("width", plotWidth)
                .attr("height", plotHeight);
        }
        clipPathRect.transition(trans)
            .attr("x", plotX)
            .attr("y", plotY)
            .attr("width", plotWidth)
            .attr("height", plotHeight);

        var yMedian = dataForPlots.actual[Math.floor(dataForPlots.actual.length / 2)];
        var xScale = d3.scaleLinear()
            .domain([0, 1])
            .range([plotX, plotX + plotWidth]);
        var yScale = d3.scaleLinear()
            .domain([yMedian - 0.5, yMedian + 0.5])
            .range([plotY + plotHeight, plotY]);
        var xValues = dataForPlots.sample;

        var plotGroups = inputGroup.selectAll("g.plot")
            .data([dataForPlots.actual, dataForPlots.estimates]);
        plotGroups.enter().append("g")
            .classed("plot", true)
            .attr("clip-path", "url(#" + clipPathUrl + ")");
        plotGroups.exit().remove();

        inputGroup.selectAll("g.plot")
            .each(function (data, plotIndex) {
                var plotGroup = d3.select(this);

                var plotPaths = plotGroup.selectAll("path.plot")
                    .data(data);
                plotPaths.enter().append("path")
                    .classed("plot", true);
                plotPaths.exit().remove(); 

                plotGroup.selectAll("path.plot")
                    .each(function (y1, i) {
                        if (i === data.length - 1) {
                            return;
                        }
                        var x1 = xValues[i];
                        var x2 = xValues[i + 1];
                        var y2 = data[i + 1];

                        var plotPath = d3.path();
                        plotPath.moveTo(xScale(x1), yScale(y1));
                        plotPath.lineTo(xScale(x2), yScale(y2));
                        plotPath.closePath();

                        d3.select(this)
                            .classed("actual", plotIndex === 0)
                            .classed("estimated", plotIndex === 1)
                            .transition(trans)
                            .attr("opacity", 1)
                            .attr("d", plotPath.toString());
                    });
            });
    },
});