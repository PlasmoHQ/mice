export enum PeerState {
  Default = "default",
  Hailing = "hailing",
  Connected = "connected"
}

export enum MessageAction {
  Hailing = "hailing",
  Connect = "connect"
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
