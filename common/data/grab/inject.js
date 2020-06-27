'use strict';

// remove the old iframe
try {
  window.iframe.remove();
}
catch (e) {}

window.iframe = document.createElement('iframe');
chrome.storage.local.get({
  width: 750,
  height: 650
}, ({width, height}) => {
  window.iframe.setAttribute('style', `
    border: none;
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    width: ${width}px;
    max-width: 80%;
    height: ${height}px;
    max-height: 90%;
    margin: auto;
    background-color: #f0f0f0;
    z-index: 10000000000;
    box-shadow: 0 0 0 10000px rgba(0, 0, 0, 0.3);
  `);
  window.iframe.src = chrome.runtime.getURL('data/grab/index.html?mode=' + window.mode);
  document.body.appendChild(window.iframe);
});

(callback => {
  document.addEventListener('click', e => {
    if (window.iframe && window.iframe.contains(e.target) === false) {
      callback();
    }
  });
  chrome.runtime.onMessage.addListener(request => {
    if (request.cmd === 'close-me') {
      callback();
    }
  });
})(() => {
  if (window.iframe) {
    window.iframe.remove();
    window.iframe = null;
  }
});
