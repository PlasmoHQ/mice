import Peer, { Instance, SignalData } from "simple-peer"

import {
  MessageAction,
  MessagePayload,
  PeerState,
  StorageKey
} from "~core/message"
import { Storage } from "~core/storage"

let peer: Instance = null

const storage = new Storage()

async function reset() {
  await Promise.all([
    storage.set(StorageKey.OpenHailing, ""),
    storage.set(StorageKey.PeerState, PeerState.Default)
  ])
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

        peer.on("data", async (rawBuffer) => {
          const data = Buffer.from(rawBuffer).toString("utf8")
          console.log(data)
        })

        peer.on("close", async () => {
          await storage.set(StorageKey.OpenHailing, "")
          await storage.set(StorageKey.PeerState, PeerState.Default)
        })

        setTimeout(async () => {
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
