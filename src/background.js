const ALARM = 'auto-update-check';
const PERIOD_MIN = 5;

function ensureAlarm() {
  chrome.alarms.get(ALARM, (a) => {
    if (!a) chrome.alarms.create(ALARM, { delayInMinutes: PERIOD_MIN, periodInMinutes: PERIOD_MIN });
  });
}

async function runCheck(source) {
  return new Promise((resolve) => {
    chrome.runtime.requestUpdateCheck((status, details) => {
      const err = chrome.runtime.lastError ? chrome.runtime.lastError.message : null;
      const result = {
        time: Date.now(), source,
        status: err ? 'error: ' + err : status,
        newVersion: details && details.version ? details.version : null
      };
      chrome.storage.local.set({ lastCheck: result }, () => {
        if (status === 'update_available') setTimeout(() => chrome.runtime.reload(), 1500);
        resolve(result);
      });
    });
  });
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(console.error);
  ensureAlarm();
});
chrome.runtime.onStartup.addListener(ensureAlarm);
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(console.error);
ensureAlarm();

chrome.alarms.onAlarm.addListener((a) => { if (a.name === ALARM) runCheck('auto'); });
chrome.runtime.onUpdateAvailable.addListener(() => chrome.runtime.reload());
chrome.runtime.onMessage.addListener((msg, _s, send) => {
  if (msg && msg.type === 'check') { runCheck('manual').then(send); return true; }
});
