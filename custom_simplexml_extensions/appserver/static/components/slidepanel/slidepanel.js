define([
    'underscore',
    'jquery',
    'splunkjs/mvc/basesplunkview',
    'splunkjs/mvc',
    'splunkjs/mvc/simplexml/ready!'
], function(_, $, BaseSplunkView, mvc) {

    var SlidePanelView = BaseSplunkView.extend({
        events: {
            'click a.btn-pill': function(e) {
                //e.preventDefault();
                var link = $(e.currentTarget);
                var itemId = link.data('item');
                var component = mvc.Components.get(itemId);
                if (component) {
                    component.$el.slideToggle(1000);
                    component.$el.resize();
                }
            }
        },
        render: function() {
            // Remove previously rendered links
            this.$('.btn-pill').remove();
            if (this.settings.has('items')) {
                var items = this.settings.get('items'), $el = this.$el;
                _(items).each(function(id) {
                    // Lookup the component instance
                    var component = mvc.Components.get(id);
                    if (component) {
                        // Create a new link for each element
                        var link = $('<a class="btn-pill"></a>');
                        link.attr('href', '#' + id).data('item', id);
                        // Use the title of the element as the link text
                        //link.text(component.settings.get('title') || "Untitled");
                        var title = component.settings.get('id') || "Untitled";
                        link.text("slide "+title);
                        link.appendTo($el);
                        component.$el.hide();
                    }
                });
            }
            return this;
        }
    });
    return SlidePanelView;
});
