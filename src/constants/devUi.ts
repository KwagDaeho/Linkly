/** Opt-in: `VITE_PIN_PERMISSION_PANEL=1 npm run tauri:dev` for layout/flow QA only. */
export const pinPermissionPanelInDev =
  import.meta.env.DEV && import.meta.env.VITE_PIN_PERMISSION_PANEL === "1";

/** Avoid auto exit/relaunch while iterating on permission UI in dev. */
export const skipPermissionRelaunchInDev = import.meta.env.DEV;
