import Peer, { Instance } from "simple-peer"

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
      case MessageAction.Hailing:
        if (peer !== null) {
          peer.destroy()
        }

        peer = new Peer({ initiator: true })

        peer.on("signal", async (data) => {
          console.log(data)

          if (data.type === "offer") {
            const base64Signal = Buffer.from(JSON.stringify(data)).toString(
              "base64"
            )

            await storage.set(StorageKey.OpenHailing, base64Signal)

            sendResponse(true)
          } else {
            peer.signal(data)
          }
        })

        peer.on("data", async (d) => {
          console.log(d)
        })

        peer.on("close", async () => {
          await storage.set(StorageKey.OpenHailing, "")
          await storage.set(StorageKey.PeerState, PeerState.Default)
        })

        return true

      case MessageAction.Connect:
        peer?.signal(
          JSON.parse(Buffer.from(message.data, "base64").toString("utf8"))
        )
        return true

      case MessageAction.Reset:
        peer.destroy()
        peer = null
      default:
        return true
    }
  }
)
