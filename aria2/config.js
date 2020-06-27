'use strict';

var config = {};

config.mode = {
  get method() {
    return localStorage.getItem('mode') || 'batch';
  },
  get sep() {
    const key = navigator.platform.substr(0, 3);
    return {
      Mac: '\\" \\"',
      Win: '" "',
      Lin: '" "'
    }[key];
  },
  supports: true
};

config.tag = 'aria2';
config.name = 'Download with aria2';

config.windowsVerbatimArguments = true;

config.cookies = true;

config.command = {
  executable: {
    Mac: '/usr/bin/osascript',
    Win: 'cmd.exe',
    Lin: 'xterm'
  },
  args: {
    Mac: `-e 'tell application "Terminal" to activate' -e 'tell application "Terminal" to do script "cd ~/Desktop && aria2c -x2 --out=\\"[FILENAME]\\" --user-agent=\\"[USERAGENT]\\" --referer=\\"[REFERRER]\\" --check-certificate=false --continue --load-cookies=[COOKIES] -Z \\"[URL]\\""'`,
    Win: `/C 'start cmd.exe "/S /K ""%ProgramFiles(x86)%\\aria2\\aria2c.exe" --out="[FILENAME]" --user-agent="[USERAGENT]" --referer="[REFERRER]" --check-certificate=false --continue --load-cookies=[COOKIES] "[URL]"""'`,
    Lin: `-hold -e 'aria2c --out="[FILENAME]" --user-agent="[USERAGENT]" --referer="[REFERRER]" --check-certificate=false --continue --load-cookies=[COOKIES] "[URL]"'`
  },
  get guess() {
    const key = navigator.platform.substr(0, 3);
    return {
      executable: config.command.executable[key],
      args: config.command.args[key]
    };
  }
};
