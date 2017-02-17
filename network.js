var LEARNING_RATE = 0.001;

function Node(layer, predCount) {
    this.layer = layer;
    this.weights = undefined;
    this.a = undefined;
    this.z = undefined;
    this.delta = undefined;
    this.gradients = undefined;

    this.setPredecessorCount(predCount);

    if (typeof Node.counter === "undefined") {
        Node.counter = 0;
    }
    this.id = Node.counter++;
}

_.extend(Node.prototype, {
    addPredecessor: function () {
        this.weights.push(this.getRandomWeight());
    },

    removePredecessor: function () {
        this.weights.pop();
    },

    setPredecessorCount: function (predCount) {
        this.weights = _.times(predCount + 1, this.getRandomWeight);
    },

    randomizeWeights: function () {
        this.weights = _.map(this.weights, this.getRandomWeight);
    },

    getRandomWeight: function () {
        return math.random(-0.1, 0.1);
    },

    getValue: function (x) {
        var a = math.dot(x, this.weights);
        return this.layer.activation.f(a);
    },

    doForwardPass: function (x) {
        this.a = math.dot(x, this.weights);
        this.z = this.layer.activation.f(this.a);
    },

    doBackwardPass: function (index, y) {
        var self = this;
        var fpa = self.layer.activation.fp(self.a);
        var predNodes = self.layer.getPredecessorNodes();

        if (y !== undefined) {
            self.delta = fpa * (self.z - y[index]);
        } else {
            self.delta = fpa * _.sumBy(self.layer.getSuccessorNodes(), function (succNode) {
                return succNode.weights[index + 1] * succNode.delta;
            });
        }

        self.gradients[0] += self.delta;
        for (var i = 1; i < self.gradients.length; i++) {
            self.gradients[i] += self.delta * predNodes[i - 1].z;
        }
    },

    applyGradients: function () {
        this.weights = math.subtract(this.weights, math.multiply(LEARNING_RATE, this.gradients));
    },

    resetGradients: function () {
        this.gradients = _.map(this.weights, _.constant(0));
    },
});

function Layer(network, index) {
    this.network = network;
    this.nodes = [new Node(this, 0)];
    this.index = index;
    this.activation = Activation.sigmoid;
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

    getValue: function (x) {
        x = x.slice();
        x.unshift(1);

        var y = _.map(this.nodes, function (node) {
            return node.getValue(x);
        });

        var succLayer = this.getSuccessor();
        return succLayer ? succLayer.getValue(y) : y;
    },

    doForwardPass: function (x) {
        if (this.isInput()) {
            _.each(this.nodes, function (node, nodeIndex) {
                node.z = x[nodeIndex];
            });
        } else {
            x = x.slice();
            x.unshift(1);

            for (node of this.nodes) {
                node.doForwardPass(x);
            }
        }

        var succLayer = this.getSuccessor();
        if (succLayer) {
            var y = _.map(this.nodes, function (node) {
                return node.z;
            });
            succLayer.doForwardPass(y);
        }
    },

    doBackwardPass: function (y) {
        if (this.isInput()) {
            return;
        }
        _.each(this.nodes, function (node, nodeIndex) {
            node.doBackwardPass(nodeIndex, y);
        });

        var predLayer = this.getPredecessor();
        if (predLayer) {
            predLayer.doBackwardPass();
        }
    },

    applyGradients: function () {
        for (node of this.nodes) {
            node.applyGradients();
        }
    },

    resetGradients: function () {
        for (node of this.nodes) {
            node.resetGradients();
        }
    },
});

function Network() {
    this.layers = [new Layer(this, 0), new Layer(this, 1)];
    this.layers[1].nodes[0].addPredecessor();
    this.layers[1].activation = Activation.linear;
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

    getValue: function (x) {
        return this.layers[1].getValue(x);
    },

    doForwardPass: function (x) {
        this.getInputLayer().doForwardPass(x);
    },

    doBackwardPass: function (y) {
        this.getOutputLayer().doBackwardPass(y);
    },

    applyGradients: function () {
        for (layer of this.layers) {
            layer.applyGradients();
        }
    },

    resetGradients: function () {
        for (layer of this.layers) {
            layer.resetGradients();
        }
    },
});
