'use strict';

const args = new URLSearchParams(location.search);

const cache = [];

const type = (type, url) => {
  const mimes = {
    'jpeg': 'image/jpeg',
    'jpg': 'image/jpg',
    'bmp': 'image/bmp',
    'gif': 'image/gif',
    'mp3': 'video/mp3',
    'wav': 'video/wav',
    'wma': 'video/wma',
    'ogg': 'video/ogg',
    'mp4': 'video/mp4',
    'flv': 'video/flv',
    'avi': 'video/avi',
    'mov': 'video/mov',
    'wmv': 'video/wmv',
    'html': 'text/html',
    'pdf': 'application/pdf',
    'exe': 'application/octet-stream',
    'zip': 'application/zip',
    'rar': 'application/x-rar-compressed',
    'tar.gz': 'application/gzip'
  };
  for (const [ext, mime] of Object.entries(mimes)) {
    if (url.indexOf('.' + ext + '?') !== -1 || url.endsWith('.' + ext)) {
      return mime;
    }
  }
  return (type || 'unknown').split(';')[0];
};

const analyze = tr => new Promise(resolve => {
  chrome.runtime.sendMessage({
    method: 'head',
    link: tr.link
  }, r => {
    tr.querySelector('[data-id=type]').textContent =
      tr.dataset.type = type(r || '', tr.link);
    resolve();
  });
});

const resolve = async () => {
  for (let i = 0; i < cache.length; i += 5) {
    await Promise.all(cache.slice(i, i + 5).map(analyze));
  }
};

const tbody = document.querySelector('tbody');
const next = links => {
  links.filter((s, i, l) => s && l.indexOf(s) === i).forEach(link => {
    const t = document.getElementById('tr');
    const clone = document.importNode(t.content, true);
    const tr = clone.querySelector('tr');
    tr.link = clone.querySelector('[data-id=link]').textContent = link;
    tbody.appendChild(clone);
    cache.push(tr);
  });
  resolve();
};

if (args.get('mode') === 'serve') {
  chrome.runtime.sendMessage({
    method: 'extracted-links'
  }, next);
}
else {
  chrome.runtime.sendMessage({
    method: 'exec',
    code: `[
      ...[...document.images].map(i => i.src),
      ...[...document.querySelectorAll('a')].map(a => a.href),
      ...[...document.querySelectorAll('video')].map(v => v.src),
      ...[...document.querySelectorAll('source')].map(v => v.src)
    ].filter(s => s && (s.startsWith('http') || s.startsWith('ftp') || s.startsWith('data:')))`
  }, resp => {
    next([].concat([], ...resp));
  });
}

//
document.addEventListener('change', e => {
  if (e.target.id === 'toggle-select') {
    [...document.querySelectorAll('tbody tr input')].forEach(input => input.checked = e.target.checked);
  }
  else if (e.target.id === 'hide-html') {
    document.body.dataset.html = !e.target.checked;
  }
  else if (e.target.id === 'hide-unknown') {
    document.body.dataset.unknown = !e.target.checked;
  }
  // update counter
  const inputs = [...document.querySelectorAll('tbody input[type=checkbox]:checked')]
    // make sure element is visible
    .filter(input => input.clientHeight);
  document.getElementById('copy').disabled = document.getElementById('download').disabled = inputs.length === 0;
  document.getElementById('copy').inputs = document.getElementById('download').inputs = inputs;
  document.getElementById('download').value = inputs.length ? `Download (${inputs.length})` : 'Download';
});
//
const notify = message => chrome.runtime.sendMessage({
  method: 'notify',
  message
});

document.addEventListener('click', async e => {
  const cmd = e.target.dataset.cmd || '';
  if (cmd === 'image/' || cmd === 'application/pdf' || cmd === 'application/') {
    [...document.querySelectorAll('tbody tr input')].forEach(input => input.checked = false);

    const trs = [...document.querySelectorAll('tbody tr')]
      .filter(tr => tr.dataset.type && tr.dataset.type.startsWith(cmd));
    trs.forEach(tr => {
      const input = tr.querySelector('input');
      input.checked = true;
    });
    document.querySelector('tbody').dispatchEvent(new Event('change', {
      bubbles: true
    }));
  }
  else if (cmd === 'download') {
    chrome.runtime.sendMessage({
      method: 'download-links',
      job: {
        url: e.target.inputs.map(input => input.closest('tr').link)
      }
    });
  }
  else if (cmd === 'copy') {
    const links = e.target.inputs.map(input => input.closest('tr').link);
    navigator.clipboard.writeText(links.join('\n')).catch(e => {
      const el = document.createElement('textarea');
      el.value = links.join('\n');
      el.style.position = 'absolute';
      el.style.left = '-9999px';
      document.body.appendChild(el);
      el.select();
      const r = document.execCommand('copy');
      document.body.removeChild(el);
      if (!r) {
        throw e;
      }
    }).then(
      () => notify(links.length + ' link(s) copied to the clipboard'),
      e => notify(e.message)
    );
  }
});
//
document.addEventListener('click', ({target}) => {
  if (target.closest('tbody') && target.tagName !== 'INPUT') {
    const tr = target.closest('tr');
    const input = tr.querySelector('input');
    input.checked = !input.checked;
    input.dispatchEvent(new Event('change', {
      bubbles: true
    }));
  }
});
//
document.getElementById('matched').addEventListener('input', e => {
  [...document.querySelectorAll('tbody tr input')].forEach(input => input.checked = false);

  const value = e.target.value;
  const trs = value.length > 2 ? [...document.querySelectorAll('tbody tr')]
    .filter(tr => tr.textContent.toLowerCase().indexOf(value.toLowerCase()) !== -1) : [];
  trs.forEach(tr => {
    const input = tr.querySelector('input');
    input.checked = true;
  });
  document.querySelector('tbody').dispatchEvent(new Event('change', {
    bubbles: true
  }));
});
