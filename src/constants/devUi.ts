/** `npm run tauri:dev` — pin permission UI on System tab for layout/flow QA. */
export const pinPermissionPanelInDev = import.meta.env.DEV;

/** Avoid auto exit/relaunch while iterating on permission UI in dev. */
export const skipPermissionRelaunchInDev = import.meta.env.DEV;
