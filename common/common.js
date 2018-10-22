/* globals config, Parser */
'use strict';

var tools = {};
tools.cookies = url => {
  if (!url || !chrome.cookies) {
    return Promise.resolve('');
  }
  return new Promise(resolve => {
    chrome.storage.local.get({
      cookies: false
    }, prefs => prefs.cookies ? chrome.cookies.getAll({
      url
    }, arr => resolve(arr.map(o => o.name + '=' + o.value).join('; '))) : resolve(''));
  });
};
tools.fetch = ({url, method = 'GET', headers = {}, data = {}}) => {
  return new Promise((resolve, reject) => {
    const req = new XMLHttpRequest();
    req.open(method, url);
    Object.entries(headers).forEach(([key, value]) => {
      req.setRequestHeader(key, value);
    });
    req.onload = () => resolve(req);
    req.onerror = req.ontimeout = () => reject(new Error('network error'));
    req.send(Object.entries(data).map(([key, value]) => key + '=' + encodeURIComponent(value)).join('&'));
  });
};

function notify(message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: '/data/icons/48.png',
    title: config.name,
    message: message.message || message
  });
}
function execute(d) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(config.command.guess, prefs => {
      if (!prefs.executable) {
        return notify('Command box is empty. Use options page to define one!');
      }
      const p = new Parser();
      tools.cookies(d.referrer).then(cookies => {
        // remove args that are not provided
        if (!d.referrer) {
          prefs.args = prefs.args.replace(/\s[^\s]*\[REFERRER\][^\s]*\s/, ' ');
        }
        if (!d.filename) {
          prefs.args = prefs.args.replace(/\s[^\s]*\[FILENAME\][^\s]*\s/, ' ');
        }

        const termref = {
          lineBuffer: prefs.args
            .replace(/\[URL\]/g, d.finalUrl || d.url)
            .replace(/\[REFERRER\]/g, d.referrer)
            .replace(/\[USERAGENT\]/g, navigator.userAgent)
            .replace(/\[FILENAME\]/g, (d.filename || '').split(/[/\\]/).pop())
            .replace(/\\/g, '\\\\')
        };
        p.parseLine(termref);

        chrome.runtime.sendNativeMessage('com.add0n.native_client', {
          permissions: ['child_process', 'path', 'os', 'crypto', 'fs'],
          args: [cookies, prefs.executable, ...termref.argv],
          script: String.raw`
            const cookies = args[0];
            const command = args[1].replace(/%([^%]+)%/g, (_, n) => env[n]);
            function execute () {
              const exe = require('child_process').spawn(command, args.slice(2), {
                detached: true,
                windowsVerbatimArguments: ${Boolean(config.windowsVerbatimArguments)}
              });
              let stdout = '', stderr = '';
              exe.stdout.on('data', data => stdout += data);
              exe.stderr.on('data', data => stderr += data);

              exe.on('close', code => {
                push({code, stdout, stderr});
                done();
              });
              if (${config.detached}) {
                setTimeout(() => {
                  push({code: 0});
                  done();
                  process.exit();
                }, 5000);
              }
            }

            if (cookies) {
              const filename = require('path').join(
                require('os').tmpdir(),
                'download-with-' + require('crypto').randomBytes(4).readUInt32LE(0) + ''
              );
              require('fs').writeFile(filename, cookies, e => {
                if (e) {
                  push({code: 1, stderr: 'cannot create tmp file'});
                  done();
                }
                else {
                  args = args.map(s => s.replace(/\[COOKIES\]/g, filename));
                  execute();
                }
              });
            }
            else {
              args = args.map(s => s.replace(/\[COOKIES\]/g, '.'));
              execute();
            }
          `
        }, res => {
          if (!res) {
            chrome.tabs.create({
              url: '/data/guide/index.html'
            });
            return reject();
          }
          if (res && res.code !== 0) {
            return reject(res.stderr || res.error || res.err);
          }
          window.setTimeout(resolve, config.delay || 0);
        });
      });
    });
  });
}

function sendTo(d, tab = {}) {
  (config.pre ? config.pre.action() : Promise.resolve(false))
    .then(running => !running && execute(d)).then(() => config.post && config.post.action(d, tab))
    .then(() => {
      if (d.id) {
        chrome.downloads.erase({
          id: d.id
        });
      }
    })
    .catch(e => e && notify(e));
}

var id;
function observe(d, response = () => {}) {
  const mimes = localStorage.getItem('mimes') || '';
  if (mimes.indexOf(d.mime) !== -1) {
    return false;
  }

  response();
  const url = d.finalUrl || d.url;
  if (url.startsWith('http') || url.startsWith('ftp')) {
    // prefer d.url over d.finalUrl as it might be closer to the actual page url
    const {hostname} = new URL(d.url || d.finalUrl);
    const whitelist = localStorage.getItem('whitelist') || '';
    if (whitelist) {
      const hs = whitelist.split('|');
      if (hs.some(s => !s.endsWith(hostname) && !hostname.endsWith(s))) {
        return false;
      }
    }
    if (d.url.indexOf('github.com/belaviyo/native-client') !== -1) {
      return false;
    }
    if (id === d.id || d.error) {
      return false;
    }

    chrome.downloads.pause(d.id, () => chrome.tabs.query({
      active: true,
      currentWindow: true
    }, tabs => {
      sendTo(d, tabs && tabs.length ? tabs[0] : {});
    }));
  }
}

function changeState(enabled) {
  const diSupport = Boolean(chrome.downloads.onDeterminingFilename);
  const download = diSupport ? chrome.downloads.onDeterminingFilename : chrome.downloads.onCreated;
  if (enabled) {
    download.addListener(observe);
  }
  else {
    download.removeListener(observe);
  }
  chrome.browserAction.setIcon({
    path: {
      '16': 'data/icons/' + (enabled ? '' : 'disabled/') + '16.png',
      '19': 'data/icons/' + (enabled ? '' : 'disabled/') + '19.png',
      '32': 'data/icons/' + (enabled ? '' : 'disabled/') + '32.png',
      '38': 'data/icons/' + (enabled ? '' : 'disabled/') + '38.png',
      '64': 'data/icons/' + (enabled ? '' : 'disabled/') + '64.png'
    }
  });
  chrome.browserAction.setTitle({
    title: `${config.name} (Integration is "${enabled ? 'enabled' : 'disabled'}")`
  });
}

function onCommand(toggle = true) {
  chrome.storage.local.get({
    enabled: false
  }, prefs => {
    const enabled = toggle ? !prefs.enabled : prefs.enabled;
    chrome.storage.local.set({
      enabled
    });
    changeState(enabled);
  });
}

chrome.browserAction.onClicked.addListener(onCommand);
onCommand(false);

// contextMenus
{
  const callback = () => {
    chrome.contextMenus.create({
      id: 'open-link',
      title: config.name,
      contexts: ['link'],
      documentUrlPatterns: ['*://*/*']
    });
    chrome.contextMenus.create({
      id: 'open-video',
      title: config.name,
      contexts: ['video', 'audio'],
      documentUrlPatterns: ['*://*/*']
    });
    chrome.contextMenus.create({
      id: 'grab',
      title: 'Download all Links',
      contexts: ['page'],
      documentUrlPatterns: ['*://*/*']
    });
  };
  chrome.runtime.onInstalled.addListener(callback);
  chrome.runtime.onStartup.addListener(callback);
}
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'grab') {
    chrome.tabs.executeScript({
      runAt: 'document_start',
      file: '/data/grab/inject.js'
    });
  }
  else {
    sendTo({
      finalUrl: info.menuItemId === 'open-video' ? info.srcUrl : info.linkUrl,
      referrer: info.pageUrl
    }, tab);
  }
});

//
chrome.runtime.onMessage.addListener((request, sender, response) => {
  if (request.method === 'exec') {
    chrome.tabs.executeScript({
      runAt: 'document_start',
      code: request.code,
      allFrames: true
    }, response);
    return true;
  }
  else if (request.method === 'download') {
    sendTo(Object.assign({
      referrer: sender.tab.url
    }, request.job), sender.tab);
  }
});

// one time; we used to use chrome.storage for storing mime-types
{
  const callback = () => chrome.storage.local.get({
    mimes: ['application/pdf'],
    ported: false
  }, prefs => {
    if (prefs.ported === false) {
      if (prefs.mimes.length) {
        localStorage.setItem('mimes', prefs.mimes.join('|'));
        chrome.storage.local.remove('mimes');
        chrome.storage.local.set({
          ported: true
        });
      }
    }
  });
  chrome.runtime.onInstalled.addListener(callback);
}

// FAQs & Feedback
chrome.storage.local.get({
  'version': null,
  'faqs': true,
  'last-update': 0
}, prefs => {
  const version = chrome.runtime.getManifest().version;

  if (prefs.version ? (prefs.faqs && prefs.version !== version) : true) {
    const now = Date.now();
    const doUpdate = (now - prefs['last-update']) / 1000 / 60 / 60 / 24 > 30;
    chrome.storage.local.set({
      version,
      'last-update': doUpdate ? Date.now() : prefs['last-update']
    }, () => {
      // do not display the FAQs page if last-update occurred less than 30 days ago.
      if (doUpdate) {
        const p = Boolean(prefs.version);
        chrome.tabs.create({
          url: chrome.runtime.getManifest().homepage_url + '&version=' + version +
            '&type=' + (p ? ('upgrade&p=' + prefs.version) : 'install'),
          active: p === false
        });
      }
    });
  }
});

{
  const {name, version} = chrome.runtime.getManifest();
  chrome.runtime.setUninstallURL(
    chrome.runtime.getManifest().homepage_url + '&rd=feedback&name=' + name + '&version=' + version
  );
}
