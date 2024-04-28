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
            get: function () {
                return container;
            },

            remove: function () {
                d3.select(container).remove();
            },

            appendChild: function (child) {
                container.appendChild(child);
            }
        }
    },

    iconUrl: function (iconName) {
        return `../../assets/icons/${iconName}.svg`;
    }
};
