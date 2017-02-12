$(function() {
    ko.bindingHandlers.fadeVisible = {
        init: function(element, valueAccessor) {
            var value = valueAccessor();
            $(element).toggle(ko.unwrap(value));
        },
        update: function(element, valueAccessor) {
            var value = valueAccessor();
            ko.unwrap(value) ? $(element).fadeIn() : $(element).fadeOut();
        }
    };
    
    $(".popover").popover();

    var app = new ViewModel();
    app.draw();
    ko.applyBindings(app);
});