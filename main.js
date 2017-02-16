$(function() {
    $(".popover").popover();

    var app = new App();
    app.drawAll();
    ko.applyBindings(app);
});