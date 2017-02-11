$(function() {
    var app = new ViewModel();
    app.network.layers[0].addNode();
    app.network.layers[0].addNode();
    app.onChangeNetwork();
    app.draw();
    ko.applyBindings(app);

    $(".popover").popover();
});