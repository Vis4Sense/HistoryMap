import { useExtractor } from '@/composables/useExtractor'

const { clippingModal } = useExtractor()

document.addEventListener('mouseover', (event) => {
  if (clippingModal.value) {
    const target = event.target as HTMLElement
    target.setAttribute('hm-clipper-hovered', 'true')
  }
})

document.addEventListener('mouseout', (event) => {
  if (clippingModal.value) {
    const target = event.target as HTMLElement
    target.removeAttribute('hm-clipper-hovered')
  }
})

document.addEventListener('click', (event) => {
  if (clippingModal.value) {
    const target = event.target as HTMLElement
    const selected = target.getAttribute('hm-clipper-selected')
    if (selected) {
      target.removeAttribute('hm-clipper-selected')
    } else {
      target.setAttribute('hm-clipper-selected', 'true')
    }

    // get all selected elements
    const selectedElements = Array.from(document.querySelectorAll('[hm-clipper-selected]'))
    console.info('selectedElements', selectedElements)

    chrome.runtime.sendMessage({
      type: 'selected-elements',
      data: selectedElements.map((element) => element.outerHTML),
    })
  }
})
