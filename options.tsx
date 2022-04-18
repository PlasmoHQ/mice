import { useEffect, useRef, useState } from "react"
import Peer, { Instance, SignalData } from "simple-peer"

import { PeerState, StorageKey } from "~core/message"
import { useStorage } from "~core/storage"

function OptionsIndex() {
  const { value: hailingFrequency, persist } = useStorage(
    StorageKey.InboundHailing
  )

  const [peerState, setPeerState] = useState<PeerState>(PeerState.Default)

  const [openHandshake, setOpenHandshake] = useState("")

  const peerRef = useRef<Instance>()

  const [ping, setPing] = useState("")

  useEffect(() => {
    const reset = () => {
      setPeerState(PeerState.Default)
      setOpenHandshake("")
      persist("")
      peerRef.current = null
    }

    const handshake = async () => {
      if (!hailingFrequency) {
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

      peer.on("close", reset)
      peer.on("error", reset)

      const hailing = JSON.parse(
        Buffer.from(hailingFrequency, "base64").toString("utf8")
      )

      const inboundHailingSignals: SignalData[] = hailing.data

      inboundHailingSignals.forEach((data) => peer.signal(data))

      setTimeout(() => {
        const base64Signal = Buffer.from(
          JSON.stringify(outboundConnectSignal)
        ).toString("base64")

        setOpenHandshake(base64Signal)

        setPeerState(PeerState.Hailing)
      }, 5000)

      peerRef.current = peer
    }

    handshake()
  }, [hailingFrequency])

  return (
    <div>
      <h2>- {peerState} -</h2>
      <p>Hailing Frequency:</p>
      <input
        value={hailingFrequency}
        onChange={(e) => persist(e.target.value)}
      />
      <p>---</p>
      <p>Share this Handshake Code:</p>
      <input readOnly value={openHandshake} />
      <p>---</p>
      <input
        value={ping}
        onChange={(e) => {
          setPing(e.target.value)

          if (peerRef.current) {
            peerRef.current.send(e.target.value)
          }
        }}
      />
    </div>
  )
}

export default OptionsIndex
