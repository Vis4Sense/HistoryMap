const tagListView = hmTagListView({ container: u('#side-panel') });
const displayTagList = () => {
    tagListView.display();
};

const addNavTagListener = () => {
    const button = document.getElementById('nav-button-tags');
    const sidePanel = document.getElementById('side-panel');
    button.addEventListener('click', () => {
        sidePanel.classList.toggle('hidden');
        if (!sidePanel.classList.contains('hidden')) {
            tagListView.display();
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    addNavTagListener();
});
