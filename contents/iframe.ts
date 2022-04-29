import type { PlasmoContentScript } from "plasmo"

export const config: PlasmoContentScript = {
  matches: ["<all_urls>"],
  all_frames: true
}

chrome.runtime.onConnectExternal.addListener(function (port) {
  if (self !== top || port.name !== "iframe") {
    return
  }
  console.log("FROM iframe connected with LOVE")

  port.onMessage.addListener(function (msg) {})
})
