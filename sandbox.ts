export const life = 42
 
window.addEventListener("message", async function (event) {
  const source = event.source as {
    window: WindowProxy
  }
 
  source.window.postMessage(eval(event.data), event.origin)
})