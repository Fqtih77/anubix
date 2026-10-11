/**
 * ODA DURUMU
 * ----------
 * Avatarın, mobilyaların ve açık ekranın durumu tek bir küçük "depo"da (store) tutulur.
 * Senaryolar (scripts.ts) depoyu her an okuyup yazabilir; React bileşenleri
 * `useSyncExternalStore` ile abone olur ve değişince yeniden çizilir.
 */

import type { AvatarState } from "./avatar/model";
import { SPOTS } from "./layout";
import type { RoomProps } from "./scene/RoomScene";

/** Avatarın kalıcı uğraşı. Senaryo bitse de sürer. */
export type Activity = "desk" | "gaming" | "sleeping";

/**
 * Tam ekran açılan katman. `direct: true` → sayfa altındaki listeden açıldı,
 * monitörden büyüme animasyonu olmadan gelir.
 */
export type Overlay = { kind: "project"; projectId: string; direct?: boolean } | { kind: "login"; direct?: boolean } | { kind: "game"; direct?: boolean };

export interface RoomState {
  avatar: AvatarState;
  room: RoomProps;
  activity: Activity;
  overlay: Overlay | null;
  /** Ekran okuyucuya ve küçük durum alanına giden kısa metin */
  status: string;
  /** Avatarın konuşma balonu */
  bubble: { text: string; id: number } | null;
}

export const SEATED_AVATAR: AvatarState = {
  pos: SPOTS.seat,
  pose: "type",
  facing: "-y",
  headFacing: undefined,
  moveMs: 0,
  headphones: false,
  holding: null,
};

export const DESK_ROOM: RoomProps = {
  chairRolled: false,
  chairLayer: "backrest",
  takenProject: null,
  loadedProject: null,
  mainScreen: "saver",
  verticalScreen: "saver",
  tv: "chill",
  headphonesOnTable: true,
  controllerOnTable: true,
  sleeping: false,
};

export const INITIAL_STATE: RoomState = {
  avatar: SEATED_AVATAR,
  room: DESK_ROOM,
  activity: "desk",
  overlay: null,
  status: "",
  bubble: null,
};

export type RoomStore = ReturnType<typeof createRoomStore>;

export function createRoomStore(initial: RoomState = INITIAL_STATE) {
  let state = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => state,
    getInitial: () => initial,
    update(fn: (s: RoomState) => RoomState) {
      state = fn(state);
      for (const l of listeners) l();
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
