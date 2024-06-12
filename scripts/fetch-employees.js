const YAML = require('yaml');
const fs = require('fs/promises');
const https = require('https');
const querystring = require('querystring');
const { JSDOM } = require('jsdom');
const { dataFile } = require('../webpack.config');

async function post(request) {
  return new Promise((resolve, reject) => {
    const req = https.request(request, res => {
      let responseText = '';
      res.on('data', chunk => responseText += chunk);
      res.on('end', () => resolve(responseText));
    });
    req.on('error', e => reject(`Problem with request: ${e.message}`));
    req.write(request.data);
    req.end();
  });
}

async function fetch(corporateNumber) {
  const data = querystring.stringify({
    'hdnSearchOffice': '3',
    'hdnSearchCriteria': '3',
    'eventId': '/search.html',
    '/search.html': '',
    'txtHoujinNo': corporateNumber
  });

  const request = {
    hostname: 'www2.nenkin.go.jp',
    port: 443,
    path: '/do/search_section',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(data)
    },
    data
  };

  const response = await post(request);
  const dom = new JSDOM(response);
  const value = dom.window.document
    .querySelector('.return_Boxcont tr:nth-child(2) td:nth-child(8)')
    .textContent;
  return Number.parseInt(value);
}

(async () => {
  const data = YAML.parse(await fs.readFile(dataFile, 'utf8'));
  data.employees = await fetch(data.corporateNumber);
  await fs.writeFile(dataFile, YAML.stringify(data));
})();
