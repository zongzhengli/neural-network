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
        for (predNode of this.successorNodes()) {
            predNode.addPredecessor();
        }
        var node = new Node(this, Math.max(1, this.predecessorNodes().length));
        this.nodes.push(node);
        return node;
    },

    removeNode: function () {
        // TODO
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

    predecessor: function () {
        return this.network.layers[this.index - 1];
    },

    successor: function () {
        return this.network.layers[this.index + 1];
    },

    predecessorNodes: function () {
        var predLayer = this.predecessor();
        return predLayer ? predLayer.nodes : [];
    },

    successorNodes: function () {
        var succLayer = this.successor();
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

    inputLayer: function () {
        return this.layers[0];
    },

    outputLayer: function () {
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
