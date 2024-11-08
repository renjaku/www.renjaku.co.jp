const BuildPlugin = require('./scripts/BuildPlugin');
const YAML = require('yaml');
const fs = require('fs/promises');
const path = require('path');
const moment = require('moment');
const { IgnorePlugin } = require('webpack');

const srcDir = path.resolve(__dirname, 'src');
const distDir = path.resolve(__dirname, 'dist');

const dataFile = path.resolve(__dirname, 'data.yaml');

module.exports = async env => {
  const data = YAML.parse(await fs.readFile(dataFile, 'utf8'));

  const config = {
    entry: {
      index: `${srcDir}/index.js`,
      contact: `${srcDir}/contact.js`,
      encoding: `${srcDir}/encoding.js`
    },
    output: { filename: '[name].bundle.js', path: `${distDir}/js` },
    plugins: [
      new IgnorePlugin({
        resourceRegExp: /^\.\/locale$/,
        contextRegExp: /moment$/
      }),
      new BuildPlugin({
        src: `${srcDir}/public`,
        dist: distDir,
        context: { ...data, moment },
        static: ['templates/nda.html', 'templates/sys.dsa.html']
      })
    ],
    mode: env.production ? 'production' : 'development'
  };

  if (env.development) {
    config.devServer = {
      static: { directory: distDir },
      allowedHosts: 'all',
      port: env.port ?? process.env.PORT ?? 8000
    };
  }

  return config;
};

module.exports.dataFile = dataFile;
