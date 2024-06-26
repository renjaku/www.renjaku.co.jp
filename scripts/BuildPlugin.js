const fs = require('fs/promises');
const path = require('path');
const nunjucks = require('nunjucks');
const { getBundleWebPath, getFiles } = require('./utils');

const pluginName = path.basename(__filename).replace(/\.[^/.]+$/, '');

const templateExtnames = {
  '.htm': '.html',
  '.html': '.html',
  '.njk': '.html',
  '.txt': '.txt'
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

        for (const file of getFiles(src)) {
          const ext = path.extname(file);
          const relativePath = path.relative(src, file);
          const relativePosixPath =
            path.posix.join(...relativePath.split(path.sep));
          const output = { path, async execute() {} };

          if (Object.keys(templateExtnames).includes(ext) &&
              !this.options.static?.includes(relativePosixPath)) {
            const context = this.options.context ?? {};
            context.$bundles = Object.keys(compilation.assets)
              .filter(x => x.endsWith('.js'))
              .map(bundleFile => {
                bundleFile = compiler.options.output.path ?
                  path.join(compiler.options.output.path, bundleFile) :
                  bundleFile;
                return getBundleWebPath(bundleFile, this.options.dist);
              });
            const content = nunjucks.render(file, context);

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
      }
    );
  }
};
