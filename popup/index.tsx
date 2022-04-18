import { useState } from "react"

import {
  MessageAction,
  MessagePayload,
  PeerState,
  StorageKey
} from "~core/message"
import { Storage, useStorage } from "~core/storage"
import { getActiveTabs } from "~core/tabs"

const usePeer = () => {
  const { value: hailingFrequency } = useStorage(StorageKey.OpenHailing)
  const peerState = useStorage(StorageKey.PeerState, async () => {
    const storage = new Storage()

    const openHf = await storage.get(StorageKey.OpenHailing)

    if (!openHf) {
      await peerState.persist(PeerState.Default)
    }
  })

  const init = async () => {
    const [tab] = await getActiveTabs()

    chrome.tabs.sendMessage<MessagePayload>(
      tab.id,
      {
        action: MessageAction.Hailing
      },
      () => {
        peerState.persist(PeerState.Hailing)
      }
    )
  }

  const handshake = async (inboundHF: string) => {
    const storage = new Storage()
    await storage.set(StorageKey.InboundHailing, inboundHF)
    chrome.runtime.openOptionsPage()
  }

  const connect = async (handshakeCode: string) => {
    const [tab] = await getActiveTabs()
    chrome.tabs.sendMessage<MessagePayload>(
      tab.id,
      {
        action: MessageAction.Connect,
        data: handshakeCode
      },
      () => {
        peerState.persist(PeerState.Connected)
      }
    )
  }

  return {
    state: peerState.value,
    init,
    hailingFrequency,
    handshake,
    connect
  }
}

function PeerHailing() {
  const [hailingFrequency, setHailingFrequency] = useState("")
  const [handshakeCode, setHandshakeCode] = useState("")
  const peer = usePeer()

  switch (peer.state) {
    case PeerState.Connected:
      return (
        <>
          <p>Connected</p>
        </>
      )
    case PeerState.Hailing:
      return (
        <>
          <p>
            Share the <b>Hailing Frequency</b> below:
          </p>
          <input value={peer.hailingFrequency} readOnly />
          <p>
            Then, paste the <b>Handshake Code</b> and connect:
          </p>
          <input
            placeholder="Enter Handshake Code here"
            value={handshakeCode}
            onChange={(e) => setHandshakeCode(e.target.value)}
          />
          <button
            disabled={!handshakeCode}
            onClick={() => peer.connect(handshakeCode)}>
            Connect
          </button>
        </>
      )

    case PeerState.Default:
    default:
      return (
        <>
          <button
            onClick={() => {
              peer.init()
            }}>
            Open Hailing Frequency
          </button>
          -- OR --
          <input
            placeholder="Enter Hailing Frequency here"
            value={hailingFrequency}
            onChange={(e) => setHailingFrequency(e.target.value)}
          />
          <button
            disabled={!hailingFrequency}
            onClick={() => peer.handshake(hailingFrequency)}>
            Get Handshake Code
          </button>
        </>
      )
  }
}

function IndexPopup() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column"
      }}>
      <PeerHailing />
    </div>
  )
}

export default IndexPopup
