var TRAINING_ITERATIONS = 1000;
var TRAINING_BATCH_SIZE = 1;
var TRAINING_UPDATE_MS = 50;

function App() {
    var self = this;
    this.network = new Network();
    this.networkVis = new NetworkVis(this.network, this.onChangeNetwork.bind(this));
    this.graphVis = new GraphVis();

    this.isTraining = false;
    this.trainInterval = null;

    this.expressions = ko.observableArray([{ 
        text: ko.observable("x"), 
        error: ko.observable(""),
    }]);

    this.inputCount = ko.observable(1);

    this.trainButtonText = ko.observable("Train");
}

_.extend(App.prototype, {
    onClickTrain: function() {
        if (this.isTraining) {
            this.trainButtonText("Train");
            clearInterval(this.trainInterval);
            this.isTraining = false;
        } else {
            this.trainButtonText("Stop");
            this.trainInterval = setInterval(this.trainNetwork.bind(this), TRAINING_UPDATE_MS);
            this.isTraining = true;
        }
    },

    onClickForget: function() {
        if (this.isTraining) {
            this.onClickTrain();
        }
        this.network.randomizeWeights();
        this.drawNetwork();
        this.drawEstimatedPlots();
    },

    onClickRandomExample: function() {
        if (this.isTraining) {
            this.onClickTrain();
        }
        this.network.reset();
        var inputLayer = this.network.getInputLayer();
        var outputLayer = this.network.getOutputLayer();

        var inputCount = math.randomInt(1, 3);
        var outputCount = math.randomInt(1, 3);
        var layerCount = math.randomInt(3, 5);

        while (inputLayer.nodes.length < inputCount) {
            inputLayer.addNode();
        }
        while (outputLayer.nodes.length < outputCount) {
            outputLayer.addNode();
        }
        while (this.network.layers.length < layerCount) {
            this.network.addHiddenLayer();
        }
        for (var i = 1; i < this.network.layers.length - 1; i++) {
            var extraNodeCount = math.randomInt(3);
            while (extraNodeCount-- > 0) {
                this.network.layers[i].addNode();
            }
        }
        var exprs = Expression.getRandom(outputCount, inputCount);
        this.expressions(_.times(outputCount, function (exprIndex) {
            return { 
                text: ko.observable(exprs[exprIndex]), 
                error: ko.observable(""),
            };
        }));

        this.onChangeNetwork();
        this.drawNetwork();
    },

    onChangeNetwork: function () {
        var inputLayer = this.network.getInputLayer();
        var outputLayer = this.network.getOutputLayer();

        this.inputCount(inputLayer.nodes.length);

        while (outputLayer.nodes.length > this.expressions().length) {
            this.expressions.push({ 
                text: ko.observable(""), 
                error: ko.observable(""),
            });
        }
        while (outputLayer.nodes.length < this.expressions().length) {
            this.expressions.pop();
        }

        $("input.expression").change();
    },

    onChangeExpression: function (koExpr, event) {
        var error = Expression.getError(koExpr.text(), this.inputCount());
        koExpr.error(error);
        $(event.target.parentNode).popover(error ? "show" : "hide");
        this.drawActualPlots();
        this.drawEstimatedPlots();
    },

    getFunctionSignature: function (index) {
        var symbols = _.take(Expression.symbols, this.inputCount());
        return "F" + (index + 1) + "(" + symbols.join(", ") + ") =";
    },

    isEveryExpressionValid: function () {
        var self = this;
        var result = _.every(self.expressions(), function (koExpr) {
            return Expression.isValid(koExpr.text(), self.inputCount())
        });
        if (!result) {
            self.isTraining = false;
        }
        return result;
    },

    getActualData: function () {
        var rangeFunc = function (code, exprIndex, symbolValues) {
            return Expression.evaluate(code, symbolValues);
        };
        return this.getDataImpl(rangeFunc);
    },

    getEstimatedData: function () {
        var self = this;
        var rangeFunc = function (code, exprIndex, symbolValues) {
            return self.network.getValue(symbolValues)[exprIndex];
        };
        return this.getDataImpl(rangeFunc);
    },

    getDataImpl: function (rangeFunc) {
        var self = this;
        var symbolCount = this.inputCount();
        var symbols = _.take(Expression.symbols, symbolCount);

        return _.map(this.expressions(), function (koExpr, exprIndex) {
            var expr = koExpr.text();

            if (!Expression.isValid(expr, symbolCount)) {
                return _.map(symbols, _.constant({
                    domain: [],
                    range: [],
                }));
            }
            var code = math.compile(expr);

            return _.map(symbols, function (symbol, symbolIndex) {
                var symbolValues = _.map(symbols, _.constant(1));
                var domainStart = -2;
                var domainWidth = 4;
                var domainInc = 0.1;
                var domain = _.range(domainStart, domainStart + domainWidth + domainInc / 2, domainInc);
                var range = _.map(domain, function (x) {
                    symbolValues[symbolIndex] = x;
                    return rangeFunc(code, exprIndex, symbolValues);
                });
                return {
                    domain: domain,
                    range: range,
                };
            });
        });
    },

    trainNetwork: function () {
        var symbolCount = this.inputCount();

        var codes = _.map(this.expressions(), function (koExpr) {
            var expr = koExpr.text();
            return Expression.isValid(expr, symbolCount) ? math.compile(expr) : null;
        });

        if (_.some(codes, _.isNull)) {
            return;
        }

        var startTime = performance.now();

        for (var iteration = 0; this.isTraining; iteration++) {
            if (iteration % 10 === 0 && performance.now() - startTime > TRAINING_UPDATE_MS) {
                break;
            }

            this.network.beginEpoch();

            for (var batch = 0; batch < TRAINING_BATCH_SIZE; batch++) {
                var x = _.times(symbolCount, function () {
                    return math.random(-2, 2);
                });

                var y = _.map(this.expressions(), function (koExpr, exprIndex) {
                    return Expression.evaluate(codes[exprIndex], x);
                });
                
                this.network.doForwardPass(x, y);
            }
            this.network.doBackwardPass();
            this.network.endEpoch();
        }
        
        this.drawNetworkFast();
        this.drawEstimatedPlotsFast();
    },

    drawActualPlots: function (plotTrans) {
        this.graphVis.draw(this.getActualData(), PlotType.actual, PlotTransition.normal);
    },

    drawEstimatedPlots: function () {
        this.graphVis.draw(this.getEstimatedData(), PlotType.estimated, PlotTransition.normal);
    },

    drawEstimatedPlotsFast: function () {
        this.graphVis.draw(this.getEstimatedData(), PlotType.estimated, PlotTransition.none);
    },

    drawNetwork: function () {
        this.networkVis.draw(NetworkTransition.normal);
    },

    drawNetworkFast: function () {
        this.networkVis.draw(NetworkTransition.none);
    },

    drawAll: function () {
        this.drawActualPlots();
        this.drawEstimatedPlots();
        this.drawNetwork();
    },
});
