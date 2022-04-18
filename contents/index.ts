import Peer, { Instance } from "simple-peer"

import { MessageAction, MessagePayload, StorageKey } from "~core/message"
import { Storage } from "~core/storage"

let peer: Instance = null

const storage = new Storage()

chrome.runtime.onMessage.addListener(
  (message: MessagePayload, sender, sendResponse) => {
    switch (message.action) {
      case MessageAction.Hailing:
        peer = new Peer({ initiator: true })

        peer.on("signal", async (data) => {
          const base64Signal = Buffer.from(JSON.stringify(data)).toString(
            "base64"
          )

          await storage.set(StorageKey.OpenHailing, base64Signal)

          sendResponse(true)
        })

        peer.on("data", async (d) => {
          console.log(d)
        })

        return true

      case MessageAction.Connect:
        peer.signal(
          JSON.parse(Buffer.from(message.data, "base64").toString("utf8"))
        )
        return true

      default:
        return true
    }
  }
)
