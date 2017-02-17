var PlotType = { Actual: "actual", Estimated: "estimated" };

function GraphVis() {
    this.svgW = 400;
    this.svgH = 300;
}

_.extend(GraphVis.prototype, {
    getPlotLength: function (dataForOutputs) {
        return 0.8 * Math.min(
            this.svgW / dataForOutputs[0].length,
            this.svgH / dataForOutputs.length);
    },

    getPlotXScale: function (dataForOutputs) {
        var centerX = this.svgW / 2;
        var halfWidth = this.getPlotLength(dataForOutputs) * dataForOutputs[0].length / 2;
        return d3.scaleLinear()
            .domain([0, dataForOutputs[0].length])
            .range([centerX - halfWidth, centerX + halfWidth]);
    },

    getPlotYScale: function (dataForOutputs) {
        var centerY = this.svgH / 2;
        var halfHeight = this.getPlotLength(dataForOutputs) * dataForOutputs.length / 2;
        return d3.scaleLinear()
            .domain([0, dataForOutputs.length])
            .range([centerY - halfHeight, centerY + halfHeight]);
    },

    getTransition: function () {
        return d3.transition()
            .duration(800);
    },

    draw: function (dataForOutputs, plotType) {
        var self = this;
        var svg = d3.select("svg.graph");
        var xScale = self.getPlotXScale(dataForOutputs);
        var yScale = self.getPlotYScale(dataForOutputs);
        var plotLength = self.getPlotLength(dataForOutputs);
        var trans = self.getTransition();

        var outputGroups = svg.selectAll("g.output")
            .data(dataForOutputs);
        outputGroups.enter()
            .append("g")
            .classed("output", true);
        outputGroups.exit()
            .transition(trans)
            .remove();

        svg.selectAll("g.output")
            .each(function (dataForInputs, outputIndex) {
                var outputGroup = d3.select(this);
                var outputExiting = outputIndex >= dataForOutputs.length;
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
                    .attr("opacity", outputExiting ? 0 : 1)
                    .attr("x", outputTextX)
                    .attr("y", outputTextY);

                var inputGroups = outputGroup.selectAll("g.input")
                    .data(dataForInputs);
                inputGroups.enter()
                    .append("g")
                    .classed("input", true);
                inputGroups.exit()
                    .transition(trans)
                    .remove();

                outputGroup.selectAll("g.input")
                    .each(function (dataForPlots, inputIndex) {
                        var inputGroup = d3.select(this);
                        var inputExiting = inputIndex >= dataForInputs.length;
                        var plotExiting = inputExiting || outputExiting;
                        var plotX = xScale(inputIndex);
                        var plotY = yScale(outputIndex);

                        self.drawSinglePlot(svg, plotType, dataForPlots, inputGroup, plotX, plotY, plotLength, plotExiting);

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
                                .attr("opacity", inputExiting ? 0 : 1)
                                .attr("x", inputTextX)
                                .attr("y", inputTextY);
                        }
                    });
            });
    },

    drawSinglePlot: function (svg, plotType, dataForPlots, inputGroup, plotX, plotY, plotLength, exiting) {
        var self = this;
        var trans = self.getTransition();
        var plotWidth = 0.9 * plotLength;
        var plotHeight = 0.9 * plotLength;
        var plotTransform = "translate(" + plotX + ", " + plotY + ")";
        var opacity = exiting ? 0 : 1;

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
            .attr("opacity", opacity)
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
        plotPaths.enter()
            .append("path")
            .classed("plot", true);
        plotPaths.exit()
            .remove();

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
                    .attr("opacity", opacity)
                    .attr("d", plotPath.toString());
            });
    },
});
