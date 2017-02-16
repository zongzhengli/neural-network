function Node(layer, predCount) {
    this.layer = layer;
    this.weights = undefined;
    this.setPredecessorCount(predCount);

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

    setPredecessorCount: function (predCount) {
        this.weights = _.times(predCount + 1, _.constant(1));
    },

    randomizeWeights: function () {
        this.weights = _.map(this.weights, Math.random);
    }, 
});

function Layer(network, index) {
    this.network = network;
    this.nodes = [new Node(this, 0)];
    this.index = index;
}

_.extend(Layer.prototype, {
    addNode: function () {
        for (succNode of this.getSuccessorNodes()) {
            succNode.addPredecessor();
        }
        var newNode = new Node(this, this.getPredecessorNodes().length);
        this.nodes.push(newNode);
        return newNode;
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
    addHiddenLayer: function () {
        var newLayer = new Layer(this, this.layers.length);
        this.layers.splice(this.layers.length - 1, 0, newLayer);

        _.each(this.layers, function (layer, index) {
            layer.index = index;
        });

        var predNodes = newLayer.getPredecessorNodes();
        var succNodes = newLayer.getSuccessorNodes();

        for (node of newLayer.nodes) {
            node.setPredecessorCount(predNodes.length);
        }
        for (succNode of succNodes) {
            succNode.setPredecessorCount(1);
        }

        var newNodeCount = Math.max(2, predNodes.length, succNodes.length);
        while (newLayer.nodes.length < newNodeCount) {
            newLayer.addNode();
        }
        return newLayer;
    },

    removeHiddenLayer: function () {
        var removedLayer = this.layers.splice(this.layers.length - 2, 1);

        var outputLayer = this.getOutputLayer();
        outputLayer.index = this.layers.length - 1;

        var predNodeCount = outputLayer.getPredecessorNodes().length;
        for (outputNode of outputLayer.nodes) {
            outputNode.setPredecessorCount(predNodeCount);
        }
        return removedLayer;
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
