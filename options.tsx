import { useEffect, useRef, useState } from "react"
import Peer, { Instance } from "simple-peer"

import { StorageKey } from "~core/message"
import { useStorage } from "~core/storage"

function OptionsIndex() {
  const { value: hailingFrequency } = useStorage(StorageKey.InboundHailing)

  const [openHandshake, setOpenHandshake] = useState("")

  const peerRef = useRef<Instance>()

  const [ping, setPing] = useState("")

  useEffect(() => {
    const handshake = async () => {
      if (!hailingFrequency) {
        return
      }

      const peer = new Peer({ initiator: false })

      peer.on("signal", async (data) => {
        // peer.signal(data)
        console.log(data)
        // queue up all the trickleing for maybe 5 seconds

        const base64Signal = Buffer.from(JSON.stringify(data)).toString(
          "base64"
        )

        setOpenHandshake(base64Signal)
      })

      peer.signal(
        JSON.parse(Buffer.from(hailingFrequency, "base64").toString("utf8"))
      )

      peerRef.current = peer
    }

    handshake()
  }, [hailingFrequency])

  return (
    <div>
      <p>Hailing Frequency:</p>
      <input readOnly value={hailingFrequency} />
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
