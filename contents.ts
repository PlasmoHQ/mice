import Peer, { Instance, SignalData } from "simple-peer"

import {
  CursorData,
  MessageAction,
  MessagePayload,
  PeerState,
  StorageKey
} from "~core/message"
import { Storage } from "~core/storage"

let peer: Instance = null

let vMouse: HTMLDivElement = null

const storage = new Storage()

async function reset() {
  if (!!vMouse) {
    vMouse.remove()
    vMouse = null
  }
  await Promise.all([
    storage.set(StorageKey.OpenHailing, ""),
    storage.set(StorageKey.PeerState, PeerState.Default)
  ])
}

// document.querySelector("#vidcloud-player > div.jw-wrapper.jw-reset > div.jw-media.jw-reset > video")

// const vid = document.querySelector("#movie_player > div.html5-video-container > video")
// console.log(vid)

const createMouse = () => {
  const mouseContainerEl = document.createElement("div")
  mouseContainerEl.style.position = "fixed"
  mouseContainerEl.style.top = "0px"
  mouseContainerEl.style.left = "0px"
  mouseContainerEl.style.width = "100vw"
  mouseContainerEl.style.height = "100vh"
  mouseContainerEl.style.zIndex = "99999"
  mouseContainerEl.style.pointerEvents = "none"

  const mouseEl = document.createElement("div")
  mouseEl.style.position = "absolute"
  mouseEl.style.width = "16px"
  mouseEl.style.height = "16px"
  mouseEl.style.borderRadius = "16px"
  mouseEl.style.backgroundColor = "transparent"
  mouseEl.style.border = "4px solid red"

  mouseContainerEl.appendChild(mouseEl)
  document.body.appendChild(mouseContainerEl)

  return mouseEl
}

window.addEventListener("load", async () => {
  if (!peer || peer.destroyed) {
    peer = null
    await reset()
  }
})

chrome.runtime.onMessage.addListener(
  (message: MessagePayload, sender, sendResponse) => {
    switch (message.action) {
      case MessageAction.Hailing: {
        if (peer !== null) {
          peer.destroy()
        }

        peer = new Peer({ initiator: true })

        const outboundHailingSignals: SignalData[] = []

        peer.on("signal", (data) => {
          outboundHailingSignals.push(data)
        })

        peer.on("connect", () => {
          vMouse = createMouse()
        })

        peer.on("data", async (rawBuffer) => {
          const data: CursorData = JSON.parse(
            Buffer.from(rawBuffer).toString("utf8")
          )

          switch (data.action) {
            case "move":
              vMouse.style.left = `${data.x * 100}vw`
              vMouse.style.top = `${data.y * 100}vh`
              break
            case "down":
              vMouse.style.background = "red"
              break
            case "up":
              vMouse.style.background = "transparent"
              break
            case "click":
              const topEl = document.elementFromPoint(
                vMouse.offsetLeft,
                vMouse.offsetTop
              )

              if (topEl instanceof HTMLElement) {
                topEl.click()
              }

              break
          }
        })

        peer.on("end", reset)
        peer.on("close", reset)
        peer.on("error", reset)

        setTimeout(async () => {
          if (outboundHailingSignals.length === 0) {
            reset()
            sendResponse(false)
            return
          }

          const base64Signal = Buffer.from(
            JSON.stringify({ data: outboundHailingSignals })
          ).toString("base64")

          await storage.set(StorageKey.OpenHailing, base64Signal)

          sendResponse(true)
        }, 5000)

        return true
      }
      case MessageAction.Connect: {
        if (!peer) {
          sendResponse(false)
          return false
        }

        const inboundConnectSignals: SignalData[] = JSON.parse(
          Buffer.from(message.data, "base64").toString("utf8")
        )

        inboundConnectSignals.forEach((data) => peer.signal(data))

        sendResponse(true)

        return true
      }
      case MessageAction.Reset: {
        peer.destroy()
        peer = null
        return true
      }
      default:
        return false
    }
  }
)
