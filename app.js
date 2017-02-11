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
    this.visualization = new Visualization(this.listen.bind(this));
    this.equations = ko.observableArray([""]);
}

_.extend(ViewModel.prototype, {
    draw: function () {
        this.visualization.drawNetwork(this.network);
    },

    listen: function () {
        var outputLayer = this.network.layers[this.network.layers.length - 1];
        while (outputLayer.nodes.length > this.equations().length) {
            this.equations.push("");
        }
    },
});
