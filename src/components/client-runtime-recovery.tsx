const recoveryScript = `
(function () {
  var RECOVERY_KEY = "jamly:chunk-recovery";
  var RECOVERY_PARAM = "_jamly_recovery";
  var RECOVERY_WINDOW_MS = 15000;

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
      message.indexOf("load failed") !== -1 ||
      message.indexOf("failed to fetch dynamically imported module") !== -1 ||
      message.indexOf("error loading dynamically imported module") !== -1 ||
      message.indexOf("importing a module script failed") !== -1 ||
      message.indexOf("module script") !== -1;
  }

  function isNextAssetFailure(value) {
    var target = value && value.target;
    if (!target || !target.tagName) return false;
    var tagName = String(target.tagName).toLowerCase();
    if (tagName !== "script" && tagName !== "link") return false;
    var assetUrl = String(target.src || target.href || "");
    return assetUrl.indexOf("/_next/") !== -1;
  }

  function reloadWithoutCache(now) {
    var url = new URL(window.location.href);
    url.searchParams.set(RECOVERY_PARAM, String(now));
    window.location.replace(url.toString());
  }

  function removeRecoveryParam() {
    var url = new URL(window.location.href);
    if (!url.searchParams.has(RECOVERY_PARAM)) return;
    url.searchParams.delete(RECOVERY_PARAM);
    window.history.replaceState(window.history.state, "", url.toString());
  }

  function recover(value) {
    if (!isChunkFailure(value) && !isNextAssetFailure(value)) return;
    try {
      var previous = Number(sessionStorage.getItem(RECOVERY_KEY) || "0");
      var now = Date.now();
      if (now - previous < RECOVERY_WINDOW_MS) return;
      sessionStorage.setItem(RECOVERY_KEY, String(now));
      reloadWithoutCache(now);
    } catch (_) {
      window.location.reload();
    }
  }

  window.addEventListener("error", function (event) { recover(event); }, true);
  window.addEventListener("unhandledrejection", function (event) { recover(event); });
  window.addEventListener("load", removeRecoveryParam, { once: true });
})();
`;

export function ClientRuntimeRecovery() {
  return <script id="jamly-client-runtime-recovery" dangerouslySetInnerHTML={{ __html: recoveryScript }} />;
}
