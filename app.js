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
    this.visualization = new Visualization(this.onChangeNetwork.bind(this));

    this.expressions = ko.observableArray([{ 
        body: ko.observable(""), 
        error: ko.observable(""),
    }]);

    this.variableCount = ko.observable(1);
}

_.extend(ViewModel.prototype, {
    onChangeNetwork: function () {
        var inputLayer = this.network.layers[0];
        var outputLayer = this.network.layers[this.network.layers.length - 1];

        this.variableCount(inputLayer.nodes.length);

        while (outputLayer.nodes.length > this.expressions().length) {
            this.expressions.push({ 
                body: ko.observable(""), 
                error: ko.observable(""),
            });
        }
    },

    onChangeExpression: function (koExpr, event) {
        // TODO: stop training
        var error = Expression.validate(koExpr.body(), this.variableCount());
        koExpr.error(error);
        $(event.target.parentNode).popover(error ? "show" : "hide");
    },

    signature: function (index) {
        // TODO: limit number of nodes in input layer
        var intputLayer = this.network.layers[0];
        var symbols = _.take(Expression.symbols, this.variableCount());
        return "f<sub>" + (index + 1) + "</sub>(" + symbols.join(", ") + ") =";
    },

    draw: function () {
        this.visualization.drawNetwork(this.network);
    },
});
