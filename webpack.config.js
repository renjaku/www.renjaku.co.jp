const BuildPlugin = require('./scripts/BuildPlugin');
const YAML = require('yaml');
const fs = require('fs/promises');
const path = require('path');
const moment = require('moment');
const { IgnorePlugin } = require('webpack');

const srcDir = path.resolve(__dirname, 'src');
const distDir = path.resolve(__dirname, 'dist');

const dataFile = path.resolve(__dirname, 'data.yml');

function createSchemaOrg(data) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    url: data.url,
    name: data.title,
    description: data.description,
    publisher: {
      '@type': 'Corporation',
      name: data.title,
      url: data.url,
      address: {
        '@type': 'PostalAddress',
        addressCountry: data.address.country,
        postalCode: data.address.postalCode,
        addressLocality: data.address.locality,
        addressRegion: data.address.region,
        streetAddress: data.address.streetAddress
      },
      identifier: {
        '@type': 'PropertyValue',
        propertyID: 'CorporateNumber',
        value: data.corporateNumber
      },
      vatID: 'T' + data.corporateNumber,
      numberOfEmployees: {
        '@type': 'QuantitativeValue',
        value: data.employees
      }
    }
  };
}

module.exports = async env => {
  const data = YAML.parse(await fs.readFile(dataFile, 'utf8'));
  data.schemaorg = createSchemaOrg(data);

  const config = {
    entry: {
      index: `${srcDir}/index.js`,
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
      host: '0.0.0.0',
      port: env.port ?? process.env.PORT ?? 8000
    };
  }

  return config;
};

module.exports.dataFile = dataFile;
