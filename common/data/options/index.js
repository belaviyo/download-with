/* globals config */
'use strict';

function save() {
  const executable = document.getElementById('executable').value;
  const args = document.getElementById('args').value;
  const cookies = document.getElementById('cookies').checked;
  const mimes = document.getElementById('mimes').value.split(/\s*,\s*/).filter((s, i, l) => l.indexOf(s) === i);
  chrome.storage.local.set({
    executable,
    args,
    cookies,
    mimes
  }, () => {
    const status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(() => status.textContent = '', 750);
  });
}

function restore() {
  // Use default value color = 'red' and likesColor = true.
  chrome.storage.local.get(Object.assign(config.command.guess, {
    cookies: false,
    mimes: ['application/pdf']
  }), prefs => {
    document.getElementById('executable').value = prefs.executable;
    document.getElementById('args').value = prefs.args;
    document.getElementById('cookies').checked = prefs.cookies;
    document.getElementById('mimes').value = prefs.mimes.join(', ');
  });
}
document.addEventListener('DOMContentLoaded', restore);
document.getElementById('save').addEventListener('click', save);

if (!config.cookies) {
  [...document.querySelectorAll('[cookies]')].forEach(e => e.style = 'opacity: 0.5; pointer-events: none;');
}
