import type { PlasmoContentScript } from "plasmo"

import { StorageKey } from "~core/message"

export const config: PlasmoContentScript = {
  matches: ["<all_urls>"],
  all_frames: true
}

chrome.storage.onChanged.addListener((objs) => {
  if (
    self === top ||
    !objs[StorageKey.IframeClick] ||
    !objs[StorageKey.IframeClick].newValue
  ) {
    return
  }

  const { x, y, href } = JSON.parse(objs[StorageKey.IframeClick].newValue)

  // console.log(location.href)

  if (location.href !== href) {
    return
  }

  window.focus()

  // console.log(x, y)

  const topEls = document.elementsFromPoint(x, y)

  const videoEl = topEls.find((el) => el instanceof HTMLVideoElement)

  if (videoEl instanceof HTMLVideoElement) {
    if (videoEl.paused) {
      videoEl.play()
    } else {
      videoEl.pause()
    }

    return
  }

  // console.log(topEls)

  const htmlEl = topEls.find((el) => el instanceof HTMLElement)

  if (htmlEl instanceof HTMLElement) {
    htmlEl.click()
  }
})
