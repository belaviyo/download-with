/* globals config */
'use strict';

function restore() {
  const mimes = (localStorage.getItem('mimes') || '').split('|');
  document.getElementById('mimes').value = mimes.join(', ');

  const whitelist = (localStorage.getItem('whitelist') || '').split('|');
  document.getElementById('whitelist').value = whitelist.join(', ');

  chrome.storage.local.get(Object.assign(config.command.guess, {
    cookies: false
  }), prefs => {
    document.getElementById('executable').value = prefs.executable;
    document.getElementById('args').value = prefs.args;
    document.getElementById('cookies').checked = prefs.cookies;
  });
}

function save() {
  const executable = document.getElementById('executable').value;
  const args = document.getElementById('args').value;
  const cookies = document.getElementById('cookies').checked;
  const mimes = document.getElementById('mimes').value
    .split(/\s*,\s*/).filter((s, i, l) => s && l.indexOf(s) === i && s.indexOf('/') !== -1);
  localStorage.setItem('mimes', mimes.join('|'));
  const whitelist = document.getElementById('whitelist').value
    .split(/\s*,\s*/).filter((s, i, l) => s && l.indexOf(s) === i);
  localStorage.setItem('whitelist', whitelist.join('|'));
  chrome.storage.local.set({
    executable,
    args,
    cookies
  }, () => {
    const status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(() => status.textContent = '', 750);
    restore();
  });
}

document.addEventListener('DOMContentLoaded', restore);
document.getElementById('save').addEventListener('click', save);

if (!config.cookies) {
  [...document.querySelectorAll('[cookies]')].forEach(e => e.style = 'opacity: 0.5; pointer-events: none;');
}

document.getElementById('reset').addEventListener('click', e => {
  if (e.detail === 1) {
    const status = document.getElementById('status');
    window.setTimeout(() => status.textContent = '', 750);
    status.textContent = 'Double-click to reset!';
  }
  else {
    localStorage.clear();
    chrome.storage.local.clear(() => {
      chrome.runtime.reload();
      window.close();
    });
  }
});
// support
document.getElementById('support').addEventListener('click', () => chrome.tabs.create({
  url: chrome.runtime.getManifest().homepage_url + '&rd=donate'
}));
