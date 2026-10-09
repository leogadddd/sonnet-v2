import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
export const useOrigin = () =>
  useSyncExternalStore(
    subscribe,
    () => window.location.origin,
    () => "",
  );
