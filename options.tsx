import { useStorage } from "@p1asm0/storage"
import { useEffect, useRef, useState } from "react"
import Peer, { Instance, SignalData } from "simple-peer"

import { CursorData, MagicNumber, PeerState, StorageKey } from "~core/message"

const useHandshakePeer = () => {
  const {
    value: hailingFrequency,
    persist,
    save
  } = useStorage(StorageKey.InboundHailing)

  const [peerState, setPeerState] = useState<PeerState>(PeerState.Default)

  const [openHandshake, setOpenHandshake] = useState("")

  const peerRef = useRef<Instance>()

  const mousePadRef = useRef<HTMLDivElement>()
  const mousePadRectRef = useRef<DOMRect>()

  useEffect(() => {
    const reset = () => {
      setPeerState(PeerState.Default)
      setOpenHandshake("")
      peerRef.current = null
    }

    const destroy = () => {
      persist("")
      reset()
    }

    const handshake = async () => {
      if (
        !hailingFrequency ||
        hailingFrequency.length < MagicNumber.MinCodeSize
      ) {
        reset()
        return
      }
      setPeerState(PeerState.GatherSignal)

      const peer = new Peer({ initiator: false })

      const outboundConnectSignal: SignalData[] = []

      peer.on("signal", (data) => {
        outboundConnectSignal.push(data)
      })

      peer.on("connect", () => {
        setPeerState(PeerState.Connected)
      })

      peer.on("end", alert)
      peer.on("close", destroy)
      peer.on("error", alert)

      const hailing = JSON.parse(
        Buffer.from(hailingFrequency, "base64").toString("utf8")
      )

      const inboundHailingSignals: SignalData[] = hailing.data

      inboundHailingSignals.forEach((data) => peer.signal(data))

      setTimeout(() => {
        if (outboundConnectSignal.length === 0) {
          return
        }

        const base64Signal = Buffer.from(
          JSON.stringify(outboundConnectSignal)
        ).toString("base64")

        setOpenHandshake(base64Signal)

        setPeerState(PeerState.Hailing)
      }, 5000)

      peerRef.current = peer
    }

    window.addEventListener("resize", () => {
      mousePadRectRef.current = mousePadRef.current?.getBoundingClientRect()
    })

    handshake()

    return () => {
      save("")
    }
  }, [hailingFrequency])

  const sendCursor = (data: CursorData) => {
    if (!peerRef.current) {
      return
    }
    peerRef.current.send(JSON.stringify(data))
  }

  const moveCursor = ({ pageX = 0, pageY = 0 }) => {
    if (!peerRef.current) {
      return
    }

    if (!mousePadRectRef.current) {
      mousePadRectRef.current = mousePadRef.current.getBoundingClientRect()
    }

    const x =
      (pageX - mousePadRectRef.current.left) / mousePadRectRef.current.width //x position within the element.
    const y =
      (pageY - mousePadRectRef.current.top) / mousePadRectRef.current.height //y position within the element.

    sendCursor({
      action: "move",
      x,
      y
    })
  }

  return {
    state: peerState,
    setHailingFrequency: persist,
    hailingFrequency,
    openHandshake,
    moveCursor,
    sendCursor,
    mousePadRef
  }
}

function OptionsIndex() {
  const peer = useHandshakePeer()

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        padding: 16,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column"
      }}>
      <span>
        <i>Hailing Frequency: </i>
        <input
          value={peer.hailingFrequency}
          onChange={(e) => peer.setHailingFrequency(e.target.value)}
        />
      </span>
      {peer.state === PeerState.GatherSignal && (
        <i>Creating Handshake, please wait...</i>
      )}
      {peer.openHandshake && (
        <span>
          Share this <b>Handshake Code</b>:
          <input readOnly value={peer.openHandshake} />
        </span>
      )}

      {peer.state === PeerState.Connected && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            height: "100%"
          }}>
          Control the remote mouse:
          <div
            ref={peer.mousePadRef}
            style={{
              maxWidth: 440,
              maxHeight: 320,
              height: "100%",
              border: "1px solid black",
              borderRadius: "8px",
              background: "gray"
            }}
            onClick={(e) => {
              peer.moveCursor(e)
              peer.sendCursor({ action: "click" })
            }}
            onMouseMove={(e) => peer.moveCursor(e)}
            onMouseDown={() => peer.sendCursor({ action: "down" })}
            onMouseUp={() => peer.sendCursor({ action: "up" })}
            onTouchMove={(e) => peer.moveCursor(e.touches[0])}
            onTouchStart={() => peer.sendCursor({ action: "down" })}
            onTouchEnd={() => peer.sendCursor({ action: "up" })}
          />
        </div>
      )}
    </div>
  )
}

export default OptionsIndex
