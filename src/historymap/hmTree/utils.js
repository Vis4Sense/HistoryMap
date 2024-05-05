/**
 * @fileoverview Utility functions for HistoryMap tree view
 */

const utils = {
    dummyContainer: function () {
        var module,
            container;

        function initialize() {
            container = document.createElement('div');
            container.style.visibility = 'hidden';
            document.body.appendChild(container);
        }

        initialize();

        return module = {
            node: function () {
                return container;
            },

            remove: function () {
                d3.select(container).remove();
            },

            appendChild: function (child) {
                container.appendChild(child);
            },

            call: function (fn) {
                fn(d3.select(container));
            },

            select: function (selector) {
                return d3.select(container).select(selector);
            }
        }
    },

    iconUrl: function (iconName) {
        return `../../assets/icons/${iconName}.svg`;
    }
};
