'use strict';

var config = {};

config.mode = {
  get method() {
    return 'parallel';
  },
  support: false
};

config.tag = 'dap';
config.name = 'Download with Download Accelerator Plus';

config.delay = 5000;
config.detached = true;

config.cookies = false;

config.pre = {
  url: 'http://127.0.0.1:10029',
  action: () => new Promise(resolve => {
    const req = new XMLHttpRequest();
    req.open('GET', config.pre.url);
    req.onload = () => resolve(true);
    req.onerror = req.ontimeout = () => resolve(false);
    req.send();
  })
};

config.command = {
  executable: {
    Mac: 'open',
    Win: '%ProgramFiles(x86)%\\DAP\\DAP.exe',
    Lin: 'DAP'
  },
  args: {
    Mac: '-a "DAP"',
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
  url: 'http://127.0.0.1:10029',
  method: 'GET',
  action: d => {
    function get(url) {
      return new Promise((resolve, reject) => {
        const req = new XMLHttpRequest();
        req.open('GET', url);
        req.onload = () => req.status === 200 ? resolve(req) : reject(req.statusText);
        req.onerror = req.timeout = () => reject('communication error');
        req.send();
      });
    }

    const link = d.finalUrl || d.url;
    const browserCalledId = 'CH';

    return get(config.post.url + '/get/downloadsign/' + encodeURIComponent(link)).then(
      r => {
        const sign = JSON.parse(r.responseText).Sign[0];
        return get(
          config.post.url + '/sign/' + sign + '/add' +
          encodeURIComponent('/linkonly/' + link) + '/caller/DWD' + browserCalledId + '/'
        );
      }
    );
  }
};
