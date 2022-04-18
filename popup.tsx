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
    await peerState.persist(PeerState.GatherSignal)
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
  const [inboundHf, setInboundHf] = useState("")
  const [outboundHandshake, setOutboundHandshake] = useState("")
  const peer = usePeer()

  switch (peer.state) {
    case PeerState.Connected:
      return (
        <>
          <p>Connected</p>
        </>
      )

    case PeerState.GatherSignal:
      return (
        <>
          <p>Gathering signal, please wait...</p>
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
            value={outboundHandshake}
            onChange={(e) => setOutboundHandshake(e.target.value)}
          />
          <button
            disabled={!outboundHandshake}
            onClick={() => peer.connect(outboundHandshake)}>
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
            value={inboundHf}
            onChange={(e) => setInboundHf(e.target.value)}
          />
          <button
            disabled={!inboundHf}
            onClick={() => peer.handshake(inboundHf)}>
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
