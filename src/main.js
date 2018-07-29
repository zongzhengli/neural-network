$(function() {
    $('[data-toggle="popover"]').popover();

    $('.popover-dismiss').popover({
      trigger: 'focus',
    });

    app = new App();
    app.drawAll();
    ko.applyBindings(app);
});