'use strict';

var config = {};

config.tag = 'flashget';
config.name = 'Download with FlashGet';

config.cookies = false;

config.command = {
  executable: {
    Mac: 'open',
    Win: '%ProgramFiles(x86)%\\FlashGet\\flashget.exe',
    Lin: 'flashget'
  },
  args: {
    Mac: '-a "flashget" "[URL]"',
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
"C:\Program Files (x86)\FlashGet Network\FlashGet 3"
