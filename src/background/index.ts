console.log('background is running')

chrome.runtime.onMessage.addListener((request) => {
  if (request.type === 'COUNT') {
    console.log('background has received a message from popup, and count is ', request?.count)
  }
})

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'checkboxMenu',
    type: 'checkbox',
    checked: true,
    title: 'Enable browser history capturing',
    contexts: ['action']
  })
})

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "checkboxMenu") {
    console.log(info)
  }
})
