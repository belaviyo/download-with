'use strict';

const config = {};
window.config = config;

config.mode = {
  get method() {
    return 'parallel';
  },
  supports: false
};

config.tag = 'fdm';
config.name = 'Download with Free Download Manager';

config.cookies = false;

config.command = {
  executable: {
    Mac: 'open',
    Win: '%ProgramFiles%\\Softdeluxe\\Free Download Manager\\fdm.exe',
    Lin: 'fdm'
  },
  args: {
    Mac: '-a "Free Download Manager" "[URL]"',
    Win: '"[URL]"',
    Lin: '"[URL]"'
  },
  get guess() {
    const key = navigator.platform.substr(0, 3);
    return {
      executable: config.command.executable[key],
      args: config.command.args[key]
    };
  }
};
