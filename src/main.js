$(function() {
    $(".popover").popover();

    app = new App();
    app.drawAll();
    ko.applyBindings(app);
});