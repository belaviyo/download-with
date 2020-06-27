{
  const div = document.createElement('div');
  const rLinks = [];
  const selection = window.getSelection();
  for (let i = 0; i < selection.rangeCount; i++) {
    const range = selection.getRangeAt(i);
    const f = range.cloneContents();
    div.appendChild(f);

    const n = range.commonAncestorContainer;
    if (n.nodeType === Node.ELEMENT_NODE) {
      rLinks.push(n.href);
    }
    else {
      rLinks.push(n.parentNode.href);
    }
  }
  [
    ...rLinks,
    ...[...div.querySelectorAll('a')].map(a => a.href),
    ...window.extraLinks
  ]
}
