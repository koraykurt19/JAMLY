const recoveryScript = `
(function () {
  var RECOVERY_KEY = "jamly:chunk-recovery";
  var RECOVERY_WINDOW_MS = 30000;

  function getMessage(value) {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (value.message) return String(value.message);
    if (value.reason) return getMessage(value.reason);
    if (value.error) return getMessage(value.error);
    return String(value);
  }

  function isChunkFailure(value) {
    var message = getMessage(value).toLowerCase();
    return message.indexOf("chunkloaderror") !== -1 ||
      message.indexOf("loading chunk") !== -1 ||
      message.indexOf("failed to fetch dynamically imported module") !== -1 ||
      message.indexOf("importing a module script failed") !== -1;
  }

  function recover(value) {
    if (!isChunkFailure(value)) return;
    try {
      var previous = Number(sessionStorage.getItem(RECOVERY_KEY) || "0");
      var now = Date.now();
      if (now - previous < RECOVERY_WINDOW_MS) return;
      sessionStorage.setItem(RECOVERY_KEY, String(now));
      window.location.reload();
    } catch (_) {
      window.location.reload();
    }
  }

  window.addEventListener("error", function (event) { recover(event); }, true);
  window.addEventListener("unhandledrejection", function (event) { recover(event); });
})();
`;

export function ClientRuntimeRecovery() {
  return <script id="jamly-client-runtime-recovery" dangerouslySetInnerHTML={{ __html: recoveryScript }} />;
}
