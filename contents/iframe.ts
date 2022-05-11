import { Storage } from "@plasmohq/storage"
import type { PlasmoContentScript } from "plasmo"

import { StorageKey } from "~core/message"

export const config: PlasmoContentScript = {
  matches: ["<all_urls>"],
  all_frames: true
}

const storage = new Storage()

storage.watch({
  [StorageKey.IframeClick]: (change) => {
    if (!change.newValue) {
      return
    }

    const { x, y, href } = JSON.parse(change.newValue)

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
  }
})
