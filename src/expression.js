var Expression = {
    symbols: ["x", "y", "z", "w", "v", "u", "t", "r", "p", "q"],

    getScope: function (values) {
        var symbols = this.symbols;
        return scope = _(values)
            .map(function (value, i) { return [symbols[i], value]; })
            .fromPairs()
            .value();
    },

    getError: function (expr, varCount) {
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

    isValid: function (expr, varCount) {
        return expr && !this.getError(expr, varCount);
    },

    evaluate: function (code, values) {
        var scope = this.getScope(values);
        var value = code.eval(scope);
        return isFinite(value) ? value : undefined;
    },

    getRandom: function (exprCount, varCount) {
        var p = math.pickRandom;
        var c1 = ["", "", "", "", "2", "2", "3", "3"];
        var c2 = ["2", "2", "2", "3", "3"];
        var c3 = ["1", "1", "2", "3"];
        var c4 = ["-1", "1"];
        var c5 = ["1", "1", "2", "2", "3"];
        var o1 = ["+", "+", "+", "+", "+", "-", "-", "-", "*"];
        var f1 = _.shuffle([
            function (x) { return p(c1) + x; },
            function (x) { return x + "/" + p(c2); },
            function (x) { return x + "^" + p(c2); },
            function (x) { return p(c2) + "^" + x; },
            //function (x) { return p(c2) + "^" + x + "-" + x; },
            //function (x) { return x + "^" + x; },
            //function (x) { return p(c3) + "/" + x; },
            function (x) { return p(c5) + "/(" + x + "+3)"; },
            //function (x) { return p(c3) + "/" + x + "-" + x; },
            //function (x) { return p(c3) + "/" + p(c2) + "^" + x; },
            function (x) { return p(c3) + "/(1+" + x + "^2)"; },
            function (x) { return "abs(" + x + ")"; },
            function (x) { return "abs(" + x + ")-" + x; },
            function (x) { return "abs(" + x + ")-" + x + "^2"; },
            function (x) { return "abs(" + x + ")^" + x },
            function (x) { return "sqrt(" + x + "+2)" },
            function (x) { return "log(" + x + "+3)"; },
            //function (x) { return "log(" + x + ")^2"; },
            function (x) { return "sin(" + p(c1) + x + ")"; },
            function (x) { return "sin(" + x + ")^" + p(c2); },
            function (x) { return "sin(" + x + ")*" + x; },
            //function (x) { return "sin(" + x + ")+" + x; },
            function (x) { return "sin(" + x + ")+sin(" + p(c2) + x + ")"; },
            function (x) { return "sin(5" + x + ")/(5" + x + ")"; },
            function (x) { return "sin(e^" + x + ")"; },
            function (x) { return "sin(abs(" + x + "))"; },
            function (x) { return "sin(" + x + ")-abs(" + x + ")"; },
            function (x) { return "sign(cos(2" + x + "))"; },
            function (x) { return "cos(" + p(c1) + x + ")"; },
            //function (x) { return x + "/cos(" + x + ")"; },
            //function (x) { return "tan(" + x + ")"; },
            //function (x) { return "tan(" + x + ")^2"; },
            //function (x) { return x + "/tan(" + x + ")"; },
            //function (x) { return "sec(" + x + ")"; },
            function (x) { return "atan(" + x + ")"; },
            function (x) { return "sinh(" + x + ")"; },
            function (x) { return "cosh(" + x + ")"; },
            function (x) { return "tanh(" + x + ")"; },
            function (x) { return "sign(" + x + ")"; },
            function (x) { return "floor(" + x + ")"; },
            function (x) { return "mod(" + x + "," + p(c2) + ")"; },
            function (x) { return "min(" + x + "," + p(c4) + ")"; },
            function (x) { return "min(abs(" + x + "),1)"; },
            function (x) { return "max(" + x + ",3" + x + ")"; },
            function (x) { return p(c3) + "/(1+e^(-" + p(c2) + x + "))"; },
            function (x) { return "e^-" + x + "^2"; },
            function (x) { return "e^sin(" + x + ")"; },
        ]);

        var symbols = _.take(this.symbols, varCount);
        var fIndex = 0;
        return _.times(exprCount, function () {
            return _.map(symbols, function (symbol, symbolIndex) {
                return (symbolIndex > 0 ? p(o1) : "") + f1[fIndex++](symbol);
            }).join("");
        });
    },
};