const fs = require('fs/promises');
const path = require('path');
const moment = require('moment');
const nunjucks = require('nunjucks');
const util = require('node:util');
const { execFile } = require('node:child_process');
const { getBundleWebPath, getFiles } = require('./utils');

const execFileAsync = util.promisify(execFile);

const pluginName = path.basename(__filename).replace(/\.[^/.]+$/, '');

const templateExtnames = {
  '.htm': '.html',
  '.html': '.html',
  '.njk': '.html',
  '.txt': '.txt'
};

const env = new nunjucks.Environment(new nunjucks.FileSystemLoader('.'));
env.addFilter('json', (value, spaces) => {
  if (value instanceof nunjucks.runtime.SafeString) value = value.toString();
  const json = JSON.stringify(value, null, spaces).replace(/</g, '\\u003c');
  return nunjucks.runtime.markSafe(json);
});
env.addFilter('numberFormat', value => new Intl.NumberFormat().format(value));
env.addFilter('dateFormat', (value, format) => moment(value).format(format));

function createSchemas(context) {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: context.title,
      url: context.url,
      address: {
        '@type': 'PostalAddress',
        addressCountry: context.address.country,
        postalCode: context.address.postalCode,
        addressLocality: context.address.locality,
        addressRegion: context.address.region,
        streetAddress: context.address.streetAddress
      },
      identifier: {
        '@type': 'PropertyValue',
        propertyID: 'corporateNumber',
        value: context.corporateNumber
      },
      vatID: 'T' + context.corporateNumber,
      numberOfEmployees: {
        '@type': 'QuantitativeValue',
        value: context.employees
      },
      founder: {
        '@type': 'Person',
        name: context.representative,
      },
      foundingDate: context.established,
      contactPoint: {
        '@type': 'ContactPoint',
        email: null,
        telephone: null,
        url: new URL(context.contactPage, context.url).href
      },
      additionalProperty: [
        {
          '@type': 'PropertyValue',
          propertyID: 'capitalStock',
          value: context.capitalStock
        }
      ]
    }
  ];
}

module.exports = class {
  constructor(options) {
    this.options = options;
  }

  apply(compiler) {
    compiler.hooks.emit.tapPromise(
      pluginName,
      async compilation => {
        const src = this.options.src;
        const dist = this.options.dist;
        const context = this.options.context ?? {};
        context.$bundles = Object.keys(compilation.assets)
          .filter(x => x.endsWith('.js'))
          .map(bundleFile => {
            bundleFile = compiler.options.output.path ?
              path.join(compiler.options.output.path, bundleFile) :
              bundleFile;
            return getBundleWebPath(bundleFile, this.options.dist);
          });
        context.schemas = createSchemas(context);

        for (const file of getFiles(src)) {
          const ext = path.extname(file);
          const relativePath = path.relative(src, file);
          const relativePosixPath =
            path.posix.join(...relativePath.split(path.sep));
          const output = { path: null, async execute() {} };

          if (Object.keys(templateExtnames).includes(ext) &&
              !this.options.static?.includes(relativePosixPath)) {
            const content = env.render(file, context);

            const relativeOutputPath = path.format({
              ...path.parse(relativePath),
              base: undefined,
              ext: templateExtnames[ext]
            });
            output.path = path.join(dist, relativeOutputPath);
            output.execute = async () => {
              await fs.writeFile(output.path, content);
              console.log(`Rendered and copied: ${file} -> ${output.path}`);
            };
          } else {
            const content = await fs.readFile(file);
            output.path = path.join(dist, relativePath);
            output.execute = async () => {
              await fs.writeFile(output.path, content);
              console.log(`Copied: ${file} -> ${output.path}`);
            };
          }

          const outputDir = path.dirname(output.path);
          await fs.mkdir(outputDir, { recursive: true });
          await output.execute();
        }

        const urlset = [];
        for (const [path, file] of Object.entries(context.pathPageMap)) {
          const { stdout } =
            await execFileAsync('git', ['log', '-1', '--format=%cd', file]);
          const url = new URL(path, context.url);
          const lastmod = new Date(stdout.trim());
          console.info(
            'Sitemap URL', `${url.href} (${file})`,
            'was last modified at', lastmod.toISOString()
          );
          urlset.push({ loc: url.href, lastmod });
        }
        let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;
        for (const { loc, lastmod } of urlset) {
          sitemap += `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod.toISOString()}</lastmod>
  </url>
`;
        }
        sitemap += '</urlset>\n';
        await fs.writeFile(path.join(dist, 'sitemap.xml'), sitemap);
      }
    );
  }
};
