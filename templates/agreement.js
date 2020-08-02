Vue.filter('number_format', value => {
  if (value.toString().match(/^\d+$/))
    return new Intl.NumberFormat('ja-JP').format(value);
  return value;
});

function formatDate(date, format) {
  return format.replace(/yyyy/g, date.getFullYear())
               .replace(/MM/g, ('0' + (date.getMonth() + 1)).slice(-2))
               .replace(/dd/g, ('0' + date.getDate()).slice(-2))
               .replace(/HH/g, ('0' + date.getHours()).slice(-2))
               .replace(/mm/g, ('0' + date.getMinutes()).slice(-2))
               .replace(/ss/g, ('0' + date.getSeconds()).slice(-2))
               .replace(/SSS/g, ('00' + date.getMilliseconds()).slice(-3));
}

window.onhashchange = () => {
  let target = document.querySelector(window.location.hash);
  let appealColor = [255, 255, 0];
  target.style.backgroundColor = `RGB(${appealColor.join(', ')})`;
  let fadeout = () => {
    appealColor = appealColor.map(x => Math.min(x + 8, 255));
    target.style.backgroundColor = `RGB(${appealColor.join(', ')})`;
    if (appealColor.filter(x => x != 255).length)
      setTimeout(fadeout, 100);
  };
  fadeout();
};

document.querySelectorAll('section > h1').forEach((elem, i) => {
  elem.innerText = `第 ${i + 1} 条 ${elem.innerText}`;
});

function OnDownload(sig) {
  return () => {
    let text = '';
    let format = (elem, i) => {
      tag = elem.nodeName.toLowerCase();
      if (['h1', 'p', 'time'].includes(tag)) {
        text += elem.innerText;
        text += '\n\n';
      } else if (['section', 'ul'].includes(tag)) {
        elem.querySelectorAll(':scope > *').forEach(format);
        text += '\n';
      } else if (tag == 'li') {
        text += i + 1 + '. ' + elem.innerText + '\n';
      }
    };
    document.querySelectorAll('main > *').forEach(format);
    text += sig.date + '\n';
    text += '\n';
    text += '  甲\n';
    text += '    ' + sig.me.addr + '\n';
    text += '    ' + sig.me.corp + '\n';
    text += '    ' + sig.me.position + ' ' + sig.me.name + '\n';
    text += '\n';
    text += '  乙\n';
    text += '    ' + sig.you.addr + '\n';
    if (sig.you.corp)
      text += '    ' + sig.you.corp + '\n';
    text += '    ';
    if (sig.you.position)
      text += sig.you.position  + ' ';
    text += sig.you.name + '\n';
    text = text.trim() + '\n'
    console.log(text);
    let data = 'data:text/plain;charset=utf-8,' + encodeURIComponent(text);
    let a = document.createElement('a');
    a.href = data;
    a.download = document.querySelector('main > h1').innerText + '.txt';
    a.click();
  };
}
