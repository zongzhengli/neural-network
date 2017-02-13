$(function() {
    $(".popover").popover();

    app = new ViewModel();
    app.drawAll();
    ko.applyBindings(app);
});