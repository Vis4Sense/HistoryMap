export function DummyContainer() {
    let container: HTMLElement

    function initialise() {
        container = document.createElement('div')
        container.style.visibility = 'hidden'
        document.body.appendChild(container)
    }

    initialise()

    return {
        node: () => container,
        remove: () => container.remove()
    }
}