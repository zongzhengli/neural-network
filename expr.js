var Expression = {
    symbols: ["x", "y", "z", "w", "v", "u", "t", "r", "p", "q"],

    validate: function (expr, varCount) {
        var parser = math.parser();
        try {
            this.evaluate(expr, _.times(varCount, _.constant(0)));
        } catch (e) {
            return e.message;
        }
        return undefined;
    },

    evaluate: function (expr, values, code) {
        code = code || math.compile(expr);
        var symbols = _.take(this.symbols, values.length);
        var scope = _(symbols)
            .map(function (symbol, i) { return [symbol, values[i]]; })
            .fromPairs()
            .value();
        var value = code.eval(scope);
        return isFinite(value) ? value : undefined;
    },
};