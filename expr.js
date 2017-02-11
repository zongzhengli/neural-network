var Expression = {
    symbols: ["x", "y", "z", "u", "v", "w"],

    take: function (varCount) {
        return _.take(this.symbols, varCount).join(", ");
    },

    validate: function (expr, varCount) {
        var parser = math.parser();
        try {
            this.evaluate(expr, _.times(varCount, _.constant(0)));
        } catch (e) {
            return e.message;
        }
        return null;
    },

    evaluate: function (expr, values) {
        var symbols = _.take(this.symbols, values.length);
        var scope = _(symbols)
            .map(function (symbol, i) { return [symbol, values[i]]; })
            .fromPairs()
            .value();
        var code = math.compile(expr);
        return code.eval(scope);
    },
};