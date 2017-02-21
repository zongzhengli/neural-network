var TRAINING_UPDATE_MS = 50;

function App() {
    var self = this;
    this.network = new Network();
    this.networkVis = new NetworkVis(this.network, this.onChangeNetwork.bind(this));
    this.graphVis = new GraphVis();

    this.isTraining = ko.observable(false);
    this.trainInterval = null;

    this.expressions = ko.observableArray([{ 
        text: ko.observable("x"), 
        error: ko.observable(""),
    }]);

    this.inputCount = ko.observable(1);
    this.networkLoss = ko.observable(undefined).extend({ rateLimit: TRAINING_UPDATE_MS });
    this.totalIterations = ko.observable(0).extend({ rateLimit: TRAINING_UPDATE_MS });
}

_.extend(App.prototype, {
    onClickTrain: function() {
        if (this.isTraining()) {
            clearInterval(this.trainInterval);
            this.networkVis.enableButtons();
            this.drawNetworkFast();
            this.isTraining(false);
        } else {
            this.trainInterval = setInterval(this.trainNetwork.bind(this), TRAINING_UPDATE_MS);
            this.networkVis.disableButtons();
            this.isTraining(true);
        }
    },

    onClickForget: function() {
        if (this.isTraining()) {
            this.onClickTrain();
        }
        this.network.randomizeWeights();
        this.networkLoss(undefined);
        this.totalIterations(0);
        this.drawNetwork();
        this.drawEstimatedPlots();
    },

    onClickRandomExample: function() {
        if (this.isTraining()) {
            this.onClickTrain();
        }
        this.network.reset();
        var inputLayer = this.network.getInputLayer();
        var outputLayer = this.network.getOutputLayer();

        var inputCount = _.random(1, 2);
        var outputCount = _.random(1, 2);
        var layerCount = _.random(3, 4);
        var hiddenNodeCount = _.random(2, 10);

        while (inputLayer.nodes.length < inputCount) {
            inputLayer.addNode();
        }
        while (outputLayer.nodes.length < outputCount) {
            outputLayer.addNode();
        }
        var hiddenLayer = this.network.addHiddenLayer();
        while (hiddenLayer.nodes.length < hiddenNodeCount) {
            hiddenLayer.addNode();
        }
        while (this.network.layers.length < layerCount) {
            this.network.addHiddenLayer();
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
                text: ko.observable("x"), 
                error: ko.observable(""),
            });
        }
        while (outputLayer.nodes.length < this.expressions().length) {
            this.expressions.pop();
        }

        this.networkLoss(undefined);
        this.totalIterations(0);
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
            self.isTraining(false);
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

        var iterations = 0;
        var totalLoss = 0;
        var startTime = performance.now();
        var hasTime = function () {
            return iterations % 10 > 0 || performance.now() - startTime < TRAINING_UPDATE_MS;
        };

        while (this.isTraining() && hasTime()) {
            var x = _.times(symbolCount, function () {
                return math.random(-2, 2);
            });
            var y = _.map(this.expressions(), function (koExpr, exprIndex) {
                return Expression.evaluate(codes[exprIndex], x);
            });
            
            this.network.doForwardPass(x);
            this.network.doBackwardPass(y);

            iterations++;
            totalLoss += this.network.getLoss();
            this.totalIterations(this.totalIterations() + 1);
        }
        
        this.networkLoss(totalLoss / iterations);
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
