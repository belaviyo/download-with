'use strict';

var config = {};

config.mode = {
  get method() {
    return 'parallel';
  },
  supports: false
};


config.tag = 'idm';
config.name = 'Download with Internet Download Manager';

config.cookies = false;

config.command = {
  executable: {
    Mac: 'open',
    Win: '%ProgramFiles(x86)%\\Internet Download Manager\\IDMan.exe',
    Lin: 'idm'
  },
  args: {
    Mac: '-a "Internet Download Manager" "[URL]"',
    Win: '/d "[URL]"',
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
