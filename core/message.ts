export const MagicNumber = {
  MinCodeSize: 18
}

export enum PeerState {
  Default = "default",
  GatherSignal = "gather-signal",
  Hailing = "hailing",
  Connected = "connected"
}

export enum MessageAction {
  Hailing = "hailing",
  Connect = "connect",
  Reset = "reset"
}

export enum StorageKey {
  PeerState = "peer-state",
  OpenHailing = "open-hailing",
  InboundHailing = "inbound-hailing"
}

export type MessagePayload = {
  action: MessageAction
  data?: string
}

export type CursorData =
  | {
      action: "move" | "iframe-click"
      x: number
      y: number
    }
  | {
      action: "click" | "down" | "up"
    }
