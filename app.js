function ViewModel() {
    this.network = new Network();
    /*/
    this.network.addLayer();
    this.network.layers[1].addNode();
    this.network.layers[0].addNode();
    //*/
    /*/
    this.network.layers[0].addNode();
    this.network.layers[0].addNode();
    this.network.layers[1].addNode();
    this.network.layers[1].addNode();
    this.network.layers[1].addNode();
    this.network.layers[1].addNode();
    this.network.layers[1].addNode();
    this.network.layers[2].addNode();
    this.network.addLayer();
    //*/
    this.networkVis = new NetworkVis(this.network, this.onChangeNetwork.bind(this));
    this.graphVis = new GraphVis();

    this.expressions = ko.observableArray([{ 
        body: ko.observable(""), 
        error: ko.observable(""),
    }]);

    this.inputCount = ko.observable(1);
}

_.extend(ViewModel.prototype, {
    onChangeNetwork: function () {
        var inputLayer = this.network.inputLayer();
        var outputLayer = this.network.outputLayer();

        this.inputCount(inputLayer.nodes.length);

        while (outputLayer.nodes.length > this.expressions().length) {
            this.expressions.push({ 
                body: ko.observable(""), 
                error: ko.observable(""),
            });
        }

        $("input.expression").change();
    },

    onChangeExpression: function (koExpr, event) {
        // TODO: stop training
        var error = Expression.validate(koExpr.body(), this.inputCount());
        koExpr.error(error);
        $(event.target.parentNode).popover(error ? "show" : "hide");
        this.drawActualPlots();
    },

    functionSignature: function (index) {
        // TODO: limit number of nodes in input layer
        var symbols = _.take(Expression.symbols, this.inputCount());
        return "F" + (index + 1) + "(" + symbols.join(", ") + ") =";
    },

    actualData: function () {
        var rangeFunc = function (expr, exprIndex, symbolValues, code) {
            return Expression.evaluate(expr, symbolValues, code);
        };
        return this.implData(rangeFunc);
    },

    estimatedData: function () {
        var self = this;
        var rangeFunc = function (expr, exprIndex, symbolValues, code) {
            return self.network.process(symbolValues)[exprIndex];
        };
        return this.implData(rangeFunc);
    },

    implData: function (rangeFunc) {
        var self = this;
        var symbolCount = this.inputCount();
        var symbols = _.take(Expression.symbols, symbolCount);

        return _.map(this.expressions(), function (koExpr, exprIndex) {
            var expr = koExpr.body();

            if (!expr || Expression.validate(expr, symbolCount)) {
                return _.map(symbols, _.constant({
                    domain: [],
                    range: [],
                    median: 0,
                }));
            }
            var code = math.compile(expr);

            return _.map(symbols, function (symbol, symbolIndex) {
                var symbolValues = _.map(symbols, _.constant(1));
                var domainStart = -5;
                symbolValues[symbolIndex] = domainStart;
                if (!Expression.evaluate(expr, symbolValues, code)) {
                    domainStart = 0.1;
                }
                var domain = _.range(domainStart, domainStart + 10.1, 0.2);
                return {
                    domain: domain,
                    range: _.map(domain, function (x) {
                        symbolValues[symbolIndex] = x;
                        return rangeFunc(expr, exprIndex, symbolValues, code);
                    }),
                    median: self.pickMedian(expr, domainStart, symbolIndex, symbolValues, code),
                };
            });
        });
    },

    pickMedian: function (expr, domainStart, symbolIndex, symbolValues, code) {
        symbolValues[symbolIndex] = domainStart + 5;
        var v1 = Expression.evaluate(expr, symbolValues, code);
        if (v1 !== undefined) {
            return v1;
        }

        symbolValues[symbolIndex] = domainStart;
        var v2 = Expression.evaluate(expr, symbolValues, code);
        symbolValues[symbolIndex] = domainStart + 10;
        var v3 = Expression.evaluate(expr, symbolValues, code);
        return (v2 + v3) / 2;
    },

    drawActualPlots: function () {
        this.graphVis.draw(this.actualData(), PlotType.Actual);
    },

    drawEstimatedPlots: function () {
        this.graphVis.draw(this.estimatedData(), PlotType.Estimated);
    },

    drawNetwork: function () {
        this.networkVis.draw();
    },

    drawAll: function () {
        this.drawActualPlots();
        this.drawEstimatedPlots();
        this.drawNetwork();
    },
});
