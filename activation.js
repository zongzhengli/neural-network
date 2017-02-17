var Activation = {
    linear: {
        f: function (x) {
            return x;
        },

        fp: function (x) {
            return 1;
        },
    },

    sigmoid: {
        f: function (a) {
            return 1 / (1 + Math.exp(-a));
        },

        fp: function (a) {
            return this.f(a) * (1 - this.f(a));
        },
    },

    tanh: {
        f: function (a) {
            return Math.tanh(a);
        },

        fp: function (a) {
            var b = Math.tanh(a);
            return 1 - b * b;
        },
    },

    atan: {
        f: function (a) {
            return Math.atan(a);
        },

        fp: function (a) {
            return 1 / (1 + a * a);
        },
    },

    softplus: {
        f: function (a) {
            return Math.log(1 + Math.exp(a));
        },

        fp: function (a) {
            return 1 / (1 + Math.exp(-a));
        },
    },
};