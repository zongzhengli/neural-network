function ViewModel() {
    this.network = new Network();
    this.network.addLayer();
    this.network.layers[1].addNode();
    this.network.layers[0].addNode();
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
        this.graphVis.draw(this.generateGraphData());
    },

    onChangeExpression: function (koExpr, event) {
        // TODO: stop training
        var error = Expression.validate(koExpr.body(), this.inputCount());
        koExpr.error(error);
        $(event.target.parentNode).popover(error ? "show" : "hide");
        this.graphVis.draw(this.generateGraphData());
    },

    functionSignature: function (index) {
        // TODO: limit number of nodes in input layer
        var symbols = _.take(Expression.symbols, this.inputCount());
        return "F" + (index + 1) + "(" + symbols.join(", ") + ") =";
    },

    generateGraphData: function () {
        /*/
        return [[{
            sample: [0, 0.2, 0.4, 0.6, 0.8, 1],
            actual: [0, 0.05, 0.1, 0.2, 0.9, 1],
            estimated: [0, 0.2, 0.4, 0.6, 0.8, 1],
        }]];
        /*/
        var self = this;
        var symbolCount = this.inputCount();
        var symbols = _.take(Expression.symbols, symbolCount);

        return _.map(this.expressions(), function (koExpr, exprIndex) {
            var expr = koExpr.body();

            if (!expr || Expression.validate(expr, symbolCount)) {
                return _.map(symbols, _.constant({
                    sample: [],
                    actual: [],
                    estimates: [],
                }));
            }
            var code = math.compile(expr);

            return _.map(symbols, function (symbol, symbolIndex) {
                var symbolValues = _.map(symbols, _.constant(0));
                var sampleRange = _.range(0, 1.05, 0.1);
                return {
                    sample: sampleRange,
                    actual: _.map(sampleRange, function (x) { 
                        symbolValues[symbolIndex] = x;
                        return Expression.evaluate(expr, symbolValues, code);
                    }),
                    estimates: _.map(sampleRange, function (x) { 
                        symbolValues[symbolIndex] = x;
                        return self.network.process(symbolValues)[exprIndex];
                    }),
                };
            });
        });
        //*/
    },

    draw: function () {
        this.graphVis.draw(this.generateGraphData());
        this.networkVis.draw();
    },
});
