/**
 * @fileoverview This file contains the code for annotating the web page.
 */

function annotate() {
    var module,
        container,
        noteBox,
        miniIcon,
        buttons,
        buttonSave,
        buttonCancel;

    var tab;
    
    const miniIconName = 'chat-square-text'

    function handleSave() {
        const note = noteBox.text();
        
        // send note to historymap
        chrome.runtime.sendMessage({
            tab: tab,
            type: "hmAddPageNote",
            text: note
        });

        miniMode();
    }

    function noteMode() {
        miniIcon.remove();
        container.append(noteBox).append(buttons);
    }

    function miniMode() {
        noteBox.remove();
        buttons.remove();
        container.append(miniIcon);
    }

    function initialize() {
        container = u('<div>')
            .addClass('hm-annotation', 'container');

        noteBox = u('<div>')
            .attr('contentEditable', true)
            .addClass('note-box');

        buttons = u('<div>').addClass('buttons');
        buttonSave = u('<button>').text('Save')
            .on('click', handleSave);
        buttonCancel = u('<button>').text('Cancel');
        buttons.append(buttonSave); // .append(buttonCancel);

        const svgUrl = chrome.runtime.getURL(`assets/icons/${miniIconName}.svg`);
        miniIcon = u('<div>').addClass('mini-icon', 'container', 'float-right')
            .append(u('<img>').attr('src', svgUrl))
            .on('click', () => {
                miniIcon.remove();
                container.append(noteBox).append(buttons);
            });

        u('body').append(container);
    }

    initialize();

    return module = {
        tab: (_) => {
            tab = _;
            return module;
        },

        showNoteBox: () => {
            if (container.find('.note-box').length) {
                return;
            }
            noteMode();
        }
    };
}
