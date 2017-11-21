'use strict';

var config = {};

config.tag = 'wget';
config.name = 'Download with Wget';

config.windowsVerbatimArguments = true;

config.cookies = true;

config.command = {
  executable: {
    Mac: '/usr/bin/osascript',
    Win: 'cmd.exe',
    Lin: 'xterm',
  },
  args: {
    Mac: `-e 'tell application "Terminal" to activate' -e 'tell application "Terminal" to do script "cd ~/Desktop && wget --output-document=\\"[FILENAME]\\" --user-agent=\\"[USERAGENT]\\" --referer=\\"[REFERRER]\\" --continue --load-cookies=[COOKIES] \\"[URL]\\""'`,
    Win: `/C 'start cmd.exe "/S /K ""%ProgramFiles(x86)%\\GnuWin32\\bin\\wget.exe" --output-document="[FILENAME]" --user-agent="[USERAGENT]" --referer="[REFERRER]" --no-check-certificate --continue --load-cookies=[COOKIES] "[URL]"""'`,
    Lin: `-hold -e 'wget --output-document="[FILENAME]" --user-agent="[USERAGENT]" --referer="[REFERRER]" --no-check-certificate --continue --load-cookies=[COOKIES] "[URL]"'`,
  },
  get guess() {
    const key = navigator.platform.substr(0, 3);
    return {
      executable: config.command.executable[key],
      args: config.command.args[key]
    };
  }
};
