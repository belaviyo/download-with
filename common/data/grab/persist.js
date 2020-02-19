'use strict';

const prefs = {
  persist: {}
};

document.addEventListener('change', ({target}) => {
  const id = target.id;
  if (id) {
    if (target.type === 'radio' || target.type === 'checkbox') {
      prefs.persist[id] = target.checked;
      // remove other elements in the group
      if (target.type === 'radio') {
        [...document.querySelectorAll(`input[type=radio][name="${target.name}"]`)].filter(e => e !== target)
          .forEach(e => delete prefs.persist[e.id]);
      }
    }
    else {
      let value = target.value;
      if (id === 'timeout') {
        value = Math.min(Math.max(5, value), 120);
      }
      prefs.persist[id] = value;
    }
    chrome.storage.local.set(prefs);
  }
});

document.addEventListener('DOMContentLoaded', () => chrome.storage.local.get(prefs, ps => {
  Object.assign(prefs, ps);
  for (const [key, value] of Object.entries(prefs.persist)) {
    const e = document.getElementById(key);
    if (e) {
      if (e.type === 'radio' || e.type === 'checkbox') {
        e.checked = value;
      }
      else {
        e.value = value;
      }
      e.dispatchEvent(new Event('change', {
        bubbles: true
      }));
    }
  }
}));
