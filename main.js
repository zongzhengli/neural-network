$(window).on("load", function() {
    var app = new ViewModel();
    app.network.layers[0].addNode();
    app.network.layers[0].addNode();
    ko.applyBindings(app);
    app.draw();
});