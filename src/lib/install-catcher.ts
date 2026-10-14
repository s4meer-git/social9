// Kept free of React so the server-rendered root layout can inline it.
/** Runs in <head> before any app code. */
export const INSTALL_CATCHER = `addEventListener("beforeinstallprompt",function(e){e.preventDefault();window.__s9install=e;dispatchEvent(new Event("s9install"))});addEventListener("appinstalled",function(){window.__s9install=null;dispatchEvent(new Event("s9install"))});`;
