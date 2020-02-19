'use strict';

const config = {};
window.config = config;

config.mode = {
  get method() {
    return 'parallel';
  },
  support: false
};

config.tag = 'uget';
config.name = 'Download with uGet';

config.delay = 5000;
config.detached = true;

config.cookies = true;

config.command = {
  executable: {
    Mac: 'open',
    Win: '%ProgramFiles(x86)%\\DAP\\DAP.exe',
    Lin: 'DAP'
  },
  args: {
    Mac: '-a "uGet"',
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
