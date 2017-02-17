var Expression = {
    symbols: ["x", "y", "z", "w", "v", "u", "t", "r", "p", "q"],

    getScope: function (values) {
        var symbols = _.take(this.symbols, values.length);
        return scope = _(symbols)
            .map(function (symbol, i) { return [symbol, values[i]]; })
            .fromPairs()
            .value();
    },

    validate: function (expr, varCount) {
        try {
            var code = math.compile(expr);
            var values = _.times(varCount, _.constant(0));
            var scope = this.getScope(values);
            var value = code.eval(scope);
            if (_.isFunction(value)) {
                return "Function not given arguments";
            }
        } catch (e) {
            return e.message;
        }
        return undefined;
    },

    evaluate: function (code, values) {
        var scope = this.getScope(values);
        var value = code.eval(scope);
        return isFinite(value) ? value : undefined;
    },
};