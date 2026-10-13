const $ = (id) => document.getElementById(id);
$('ver').textContent = 'v' + chrome.runtime.getManifest().version;

function showLast(lc) {
  if (!lc) { $('last').textContent = 'Last check: never'; return; }
  $('last').textContent = `Last check: ${new Date(lc.time).toLocaleString()} (${lc.source}) → ${lc.status}` +
    (lc.newVersion ? ` v${lc.newVersion}` : '');
}
chrome.storage.local.get('lastCheck', (r) => showLast(r.lastCheck));
chrome.storage.onChanged.addListener((c) => { if (c.lastCheck) showLast(c.lastCheck.newValue); });

$('check').addEventListener('click', () => {
  $('status').textContent = 'Checking…';
  chrome.runtime.sendMessage({ type: 'check' }, (res) => {
    if (!res) { $('status').textContent = 'No response'; return; }
    $('status').textContent = 'Status: ' + res.status +
      (res.status === 'update_available' ? ` (v${res.newVersion}) — reloading…` : '');
  });
});

function tick() {
  chrome.alarms.get('auto-update-check', (a) => {
    if (!a) { $('count').textContent = '--:--'; return; }
    const s = Math.max(0, Math.round((a.scheduledTime - Date.now()) / 1000));
    $('count').textContent = String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  });
}
tick(); setInterval(tick, 1000);
