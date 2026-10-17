import * as esbuild from 'esbuild';

const watch = process.argv.includes('--watch');

/** Bundles the widget into one minified IIFE that client sites load with a single <script> tag. */
const options = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  minify: !watch,
  sourcemap: watch ? 'inline' : false,
  format: 'iife',
  target: ['es2020'],
  outfile: 'dist/widget.js',
  legalComments: 'none',
  logLevel: 'info',
};

if (watch) {
  const ctx = await esbuild.context(options);
  await ctx.watch();
} else {
  await esbuild.build(options);
}
