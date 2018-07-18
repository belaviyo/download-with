/* globals tools */
'use strict';

var config = {};

config.tag = 'jdownloader';
config.name = 'Download with JDownloader';

config.delay = 5000;

config.cookies = true;

config.pre = {
  url: 'http://127.0.0.1:9666/flash/',
  action: () => tools.fetch(config.pre).then(() => true, () => false)
};

config.command = {
  executable: {
    Mac: 'open',
    Win: '%LocalAppData%\\JDownloader v2.0\\JDownloader2.exe',
    Lin: 'JDownloader2'
  },
  args: {
    Mac: '-a "JDownloader2"',
    Win: '',
    Lin: ''
  },
  get guess() {
    const key = navigator.platform.substr(0, 3);
    return {
      executable: config.command.executable[key],
      args: config.command.args[key]
    };
  }
};

config.post = {
  url: 'http://127.0.0.1:9666/flashgot',
  method: 'POST',
  action: (d, tab) => (d.referrer ? tools.cookies(d.referrer) : Promise.resolve('')).then(cookies => {
    let index = 0;
    const delay = t => new Promise(resolve => window.setTimeout(resolve, t));
    const once = () => tools.fetch(Object.assign(config.post, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: {
        urls: d.finalUrl || d.url,
        referer: d.referrer || '',
        autostart: 1,
        package: tab.title || '',
        description: 'Initiated by ' + config.name,
        cookies,
        fnames: (d.filename || '').split(/[/\\]/).pop(),
        source: chrome.runtime.getURL('')
      }
    })).then(r => {
      if (r.status !== 200) {
        throw new Error('Connection is rejected by JDownloader');
      }
    }).catch(e => {
      index += 1;
      if (index < 20 && e.message !== 'Connection is rejected by JDownloader') {
        return delay(config.delay).then(once);
      }
      throw new Error(
        'Cannot send command to JDownloader; Make sure ' +
        config.post.url +
        ' is accessible'
      );
    });
    return once();
  })
};
