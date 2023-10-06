import { useEffect, useRef, useState } from "react"
 
function IndexPopup() {
  const iframeRef = useRef<HTMLIFrameElement>(null)
 
  useEffect(() => {
    window.addEventListener("message", (event) => {
      console.log("EVAL output: " + event.data)
    })
  }, [])
 
  return (
    <div>
      <button
        onClick={() => {
          iframeRef.current.contentWindow.postMessage("10 + 20", "*")
        }}>
        Trigger iframe eval
      </button>
      <iframe src="sandbox.html" ref={iframeRef} style={{ display: "none" }} />
    </div>
  )
}
 
export default IndexPopup
