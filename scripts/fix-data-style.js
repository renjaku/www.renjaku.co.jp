const YAML = require('yaml');
const fs = require('fs/promises');
const { dataFile } = require('../webpack.config');

(async () => {
  const data = YAML.parse(await fs.readFile(dataFile, 'utf8'));
  await fs.writeFile(dataFile, YAML.stringify(data));
})();
