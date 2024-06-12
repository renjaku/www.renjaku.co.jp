window.YAML = require('yaml');
window.moment = require('moment');

if (window.location.hostname !== 'localhost') {
  // Google Analytics
  const TARGET = 'G-NHWWDSSJ9Y';
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', TARGET);
  const script = document.createElement('script');
  script.src = 'https://www.googletagmanager.com/gtag/js?id=' + TARGET;
  document.querySelector('head').append(script);
}
