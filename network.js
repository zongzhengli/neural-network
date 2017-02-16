function Node(layer, weightsLength) {
    this.layer = layer;
    this.weights = _.times(weightsLength, _.constant(1));

    if (typeof Node.counter === "undefined") {
        Node.counter = 0;
    }
    this.id = Node.counter++;
}

_.extend(Node.prototype, {
    addPredecessor: function () {
        this.weights.push(1);
    },

    removePredecessor: function () {
        this.weights.pop();
    },

    randomizeWeights: function () {
        this.weights = _.map(this.weights, Math.random);
    }, 
});

function Layer(network, index) {
    this.network = network;
    this.nodes = [new Node(this, 1)];
    this.index = index;
}

_.extend(Layer.prototype, {
    addNode: function () {
        for (succNode of this.getSuccessorNodes()) {
            succNode.addPredecessor();
        }
        var node = new Node(this, this.getPredecessorNodes().length + 1);
        this.nodes.push(node);
        return node;
    },

    removeNode: function () {
        for (succNode of this.getSuccessorNodes()) {
            succNode.removePredecessor();
        }
        return this.nodes.pop();
    },

    isInput: function () {
        return this.index === 0;
    },

    isOutput: function () {
        return this.index === this.network.layers.length - 1;
    },

    isHidden: function () {
        return this.index > 0 && this.index < this.network.layers.length - 1;
    },

    getPredecessor: function () {
        return this.network.layers[this.index - 1];
    },

    getSuccessor: function () {
        return this.network.layers[this.index + 1];
    },

    getPredecessorNodes: function () {
        var predLayer = this.getPredecessor();
        return predLayer ? predLayer.nodes : [];
    },

    getSuccessorNodes: function () {
        var succLayer = this.getSuccessor();
        return succLayer ? succLayer.nodes : [];
    },

    randomizeWeights: function () {
        for (node of this.nodes) {
            node.randomizeWeights();
        }
    }, 
});

function Network() {
    this.layers = [new Layer(this, 0), new Layer(this, 1)];
    this.layers[1].nodes[0].addPredecessor();
    this.trained = false;
}

_.extend(Network.prototype, {
    addLayer: function () {
        var layer = new Layer(this, this.layers.length);
        this.layers.push(layer);
        return layer;
    },

    removeLayer: function () {
        // TODO
    },

    getInputLayer: function () {
        return this.layers[0];
    },

    getOutputLayer: function () {
        return this.layers[this.layers.length - 1];
    },

    randomizeWeights: function () {
        for (layer of this.layers) {
            layer.randomizeWeights();
        }
    },

    train: function (data) {
        // TODO
        this.trained = true;
    },

    process: function (data) {
        // TODO
        return _.map(this.outputLayer().nodes, Math.random);
    },
});
