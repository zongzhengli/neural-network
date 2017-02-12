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
        var inputLayer = this.network.layers[0];
        var outputLayer = this.network.layers[this.network.layers.length - 1];

        this.inputCount(inputLayer.nodes.length);

        while (outputLayer.nodes.length > this.expressions().length) {
            this.expressions.push({ 
                body: ko.observable(""), 
                error: ko.observable(""),
            });
        }
    },

    onChangeExpression: function (koExpr, event) {
        // TODO: stop training
        var error = Expression.validate(koExpr.body(), this.inputCount());
        koExpr.error(error);
        $(event.target.parentNode).popover(error ? "show" : "hide");
    },

    functionSignature: function (index) {
        // TODO: limit number of nodes in input layer
        var intputLayer = this.network.layers[0];
        var symbols = _.take(Expression.symbols, this.inputCount());
        return "f<sub>" + (index + 1) + "</sub>(" + symbols.join(", ") + ") =";
    },

    generateGraphData: function () {
        // TODO: sample expressions
        // TODO: sample ann outputs
        //*/
        return [[[
            [0, 0.2, 0.4, 0.6, 0.8, 1],
            [0, 0.05, 0.1, 0.2, 0.9, 1],
            [0, 0.2, 0.4, 0.6, 0.8, 1]
        ]]];
        /*/
        return [[
                [[0, 0.2, 0.4, 0.6, 0.8, 1], [0, 0.1, 0.3, 0.7, 0.9, 1], [0, 0.2, 0.4, 0.6, 0.8, 1]],
                [[0, 0.2, 0.4, 0.6, 0.8, 1], [0, 0.1, 0.3, 0.7, 0.9, 1], [0, 0.2, 0.4, 0.6, 0.8, 1]],
                [[0, 0.2, 0.4, 0.6, 0.8, 1], [0, 0.1, 0.3, 0.7, 0.9, 1], [0, 0.2, 0.4, 0.6, 0.8, 1]],
            ], [
                [[0, 0.2, 0.4, 0.6, 0.8, 1], [0, 0.1, 0.3, 0.7, 0.9, 1], [0, 0.2, 0.4, 0.6, 0.8, 1]],
                [[0, 0.2, 0.4, 0.6, 0.8, 1], [0, 0.1, 0.3, 0.7, 0.9, 1], [0, 0.2, 0.4, 0.6, 0.8, 1]],
                [[0, 0.2, 0.4, 0.6, 0.8, 1], [0, 0.1, 0.3, 0.7, 0.9, 1], [0, 0.2, 0.4, 0.6, 0.8, 1]],
            ]];
        //*/
    },

    draw: function () {
        this.graphVis.draw(this.generateGraphData());
        this.networkVis.draw();
    },
});
