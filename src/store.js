import { writable, readable } from "svelte/store";

export const TLD = readable(".og");
export const CONTRACT_ADDRESS = readable(
  "0xCc86d17c39734251dd863705103D929448969bFD"
);

export const currentAccount = writable("");
export const currentNetwork = writable("");
export const connectedContract = writable();
export const domain = writable("");
export const record = writable("");
export const mints = writable([]);

export const editing = writable(false);
