import { Storage, useStorage } from "@plasmohq/storage"
import { useEffect, useState } from "react"

import {
  MagicNumber,
  MessageAction,
  MessagePayload,
  PeerState,
  StorageKey
} from "~core/message"
import { getActiveTabs } from "~core/tabs"

const useHailingPeer = () => {
  const [hailingFrequency] = useStorage(StorageKey.OpenHailing)
  const [peerState, setPeerState] = useStorage(
    StorageKey.PeerState,
    PeerState.Default
  )

  const init = async () => {
    await setPeerState(PeerState.GatherSignal)
    const [tab] = await getActiveTabs()

    chrome.tabs.sendMessage<MessagePayload, boolean>(
      tab.id,
      {
        action: MessageAction.Hailing
      },
      (ok) => {
        setPeerState(ok ? PeerState.Hailing : PeerState.Default)
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
        setPeerState(PeerState.Connected)
        setTimeout(() => {
          window.close()
        }, 3000)
      }
    )
  }

  const disconnect = async () => {
    const [tab] = await getActiveTabs()
    chrome.tabs.sendMessage<MessagePayload>(
      tab.id,
      {
        action: MessageAction.Reset
      },
      () => {
        setPeerState(PeerState.Default)
      }
    )
  }

  return {
    state: peerState,
    init,
    hailingFrequency,
    handshake,
    connect,
    disconnect
  }
}

function PeerHailing() {
  const [inboundHf, setInboundHf] = useState("")
  const [outboundHandshake, setOutboundHandshake] = useState("")
  const peer = useHailingPeer()

  useEffect(() => {
    if (inboundHf.length > MagicNumber.MinCodeSize) {
      peer.handshake(inboundHf)
    }
  }, [inboundHf])

  useEffect(() => {
    if (outboundHandshake.length > MagicNumber.MinCodeSize) {
      peer.connect(outboundHandshake)
    }
  }, [outboundHandshake])

  switch (peer.state) {
    case PeerState.Connected:
      return (
        <div>
          <i>Connected</i>
          <button onClick={() => peer.disconnect()}>Disconnect</button>
        </div>
      )

    case PeerState.GatherSignal:
      return <i>Gathering signal, please wait...</i>

    case PeerState.Hailing:
      return (
        <>
          <label>
            Share the <b>Hailing Frequency</b>:
          </label>
          <input value={peer.hailingFrequency} readOnly />
          <br />
          <label>
            Then, paste the <b>Handshake Code</b>:
          </label>
          <input
            placeholder="Enter Handshake Code"
            value={outboundHandshake}
            onChange={(e) => setOutboundHandshake(e.target.value)}
          />
          <button onClick={() => peer.disconnect()}>Cancel</button>
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
            placeholder="Enter Hailing Frequency"
            value={inboundHf}
            onChange={(e) => setInboundHf(e.target.value)}
          />
        </>
      )
  }
}

function IndexPopup() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        padding: 16
      }}>
      <PeerHailing />
    </div>
  )
}

export default IndexPopup
