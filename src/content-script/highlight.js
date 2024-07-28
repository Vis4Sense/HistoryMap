/**
 * @fileoverview Highlighting
 * 
 * Highlighting is done using the rangy library.
 * @see {@link https://github.com/timdown/rangy}
 * 
 * Specifically, these demos might be useful:
 * 
 * @see {@link https://github.com/timdown/rangy/blob/master/demos/highlighter.html}
 * Example usage of highlighter
 * 
 * @see {@link https://github.com/timdown/rangy/blob/master/demos/core.html}
 * Example usage of rangy range object
 * 
 * More details on the APIs can be found in these documents:
 * 
 * @see {@link https://github.com/timdown/rangy/wiki/Highlighter-Module}
 */

const Highlight = () => {
    var module,
        highlighter;

    function initialize() {
        console.log('loading histormap highlight');

        rangy.init();
        highlighter = rangy.createHighlighter();
        highlighter.addClassApplier(rangy.createClassApplier("highlight", {
            ignoreWhiteSpace: true,
            tagNames: ["span", "a"]
        }));

        // example of load serialsed selection
        // const serialized = '7/1/1/3/7/3/3/2:1,0/10/1/1/3/7/3/3/2:2'
        // if (rangy.canDeserializeSelection(serialized)) {
        //     const selection = rangy.deserializeSelection(serialized);
        //     highlighter.highlightSelection('highlight', { selection });
        // }
    }

    initialize();

    return module = {
        highlightSelection: () => {
            const selection = rangy.getSelection();
            highlighter.highlightSelection('highlight', { selection });

            const serializedString = rangy.serializeSelection(selection);
            const uuidPattern = /\{([a-f0-9\-]+)\}$/i;
            const match = serializedString.match(uuidPattern);

            let uuid, serialized;

            if (match) {
                uuid = match[1];
                serialized = serializedString.replace(uuidPattern, '');
            } else {
                console.error('Failed to extract uuid from serialized selection');
            }

            return {
                uuid,
                text: selection.toString(),
                serialized,
            };
        },
    };
}

const highlight = Highlight();
