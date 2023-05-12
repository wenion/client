import {
  buildCSS,
  buildJS,
  generateManifest,
  runTests,
  watchJS,
} from '@hypothesis/frontend-build';
import changed from 'gulp-changed';
import gulp from 'gulp';

import serveDev from './dev-server/serve-dev.js';
import servePackage from './dev-server/serve-package.js';
import tailwindConfig from './tailwind.config.mjs';
import annotatorTailwindConfig from './tailwind-annotator.config.mjs';
import sidebarTailwindConfig from './tailwind-sidebar.config.mjs';
import siteTailwindConfig from './tailwind-site.config.mjs';

gulp.task('build-js', () => buildJS('./rollup.config.mjs'));
gulp.task('watch-js', () => watchJS('./rollup.config.mjs'));

gulp.task('build-annotator-tailwind-css', () =>
  buildCSS(['./src/styles/annotator/annotator.scss'], {
    tailwindConfig: annotatorTailwindConfig,
  })
);

gulp.task('build-sidebar-tailwind-css', () =>
  buildCSS(
    [
      // sidebar styles (with tailwind)
      './src/styles/sidebar/sidebar.scss',
      // TODO: After tailwind migration complete, should this
      // be managed with its own tailwind config?
      './src/styles/ui-playground/ui-playground.scss',
    ],
    { tailwindConfig: sidebarTailwindConfig }
  )
);

gulp.task('build-standalone-css', () =>
  buildCSS(
    [
      // styles processed by tailwind, used by annotator
      './src/styles/annotator/highlights.scss',
      // other styles used by annotator (standalone)
      './src/styles/annotator/pdfjs-overrides.scss',

      // Vendor
      './node_modules/katex/dist/katex.min.css',
    ],
    { tailwindConfig }
  )
);

gulp.task('build-site-css', () =>
  buildCSS([
      './src/styles/site/site.scss',
  ],
  { tailwindConfig: siteTailwindConfig }
  )
);

gulp.task(
  'build-css',
  gulp.parallel(
    'build-annotator-tailwind-css',
    'build-sidebar-tailwind-css',
    'build-standalone-css',
    'build-site-css'
  )
);

gulp.task(
  'watch-css',
  gulp.series('build-css', function watchCSS() {
    gulp.watch(
      [
        'node_modules/katex/dist/katex.min.css',
        'src/styles/**/*.scss',
        'src/sidebar/components/**/*.js',
        'src/site/components/**/*.js',
        'src/annotator/components/**/*.js',
        'dev-server/ui-playground/components/**/*.js',
      ],
      gulp.task('build-css')
    );
  })
);

const fontFiles = ['node_modules/katex/dist/fonts/*.woff2', 'src/site/static/fonts/*.woff2'];

gulp.task('build-fonts', () => {
  // Fonts are located in a subdirectory of `build/styles` so that we can reuse
  // KaTeX's CSS bundle directly without any URL rewriting.
  const fontsDir = 'build/styles/fonts';
  return gulp.src(fontFiles).pipe(changed(fontsDir)).pipe(gulp.dest(fontsDir));
});

gulp.task(
  'watch-fonts',
  gulp.series('build-fonts', function watchFonts() {
    gulp.watch(fontFiles, gulp.task('build-fonts'));
  })
);

const staticAsset = ['src/site/static/*.html'];

gulp.task('build-static-asset', () => {
  const staticBuild = 'build';
  return gulp.src(staticAsset).pipe(changed(staticBuild)).pipe(gulp.dest(staticBuild));
});

gulp.task('watch-static-asset', () =>{
  gulp.watch(
    staticAsset,
    gulp.task('build-static-asset')
  );
});

// Files to reference in `build/manifest.json`, used by `build/boot.js`.
const manifestSourceFiles = 'build/{scripts,styles}/*.{css,js,map}';

gulp.task('build-boot-script', async () => {
  await generateManifest({ pattern: manifestSourceFiles });
  await buildJS('./rollup-boot.config.mjs');
});

gulp.task('watch-boot-script', () => {
  gulp.watch(
    [
      manifestSourceFiles,

      // This relies on the boot script only depending on modules in src/boot.
      //
      // We could alternatively use `watchJS` to rebuild the bundle, but we'd
      // need to make its logging less noisy first.
      'src/boot/**/*.{js,ts,tsx}',
    ],
    { delay: 500 },
    gulp.task('build-boot-script')
  );
});

// Files to test Dev
const clientDir = ['build/**/*'];

gulp.task('build-client', gulp.series('build-static-asset', 'build-boot-script', () => {
  const clientBuild = 'dev-server/build';
  return gulp.src(clientDir).pipe(changed(clientBuild)).pipe(gulp.dest(clientBuild));
}));

gulp.task('watch-client', () =>{
  gulp.watch(
    [
      'src/styles/site/**/*.scss',
      'src/site/**/*.(js|ts|tsx|html)',
    ],
    { delay: 500 },
    gulp.task('build-client')
  );
});

gulp.task('serve-package', () => {
  servePackage(3001);
});

gulp.task('serve-test-pages', () => {
  serveDev(3000, { clientUrl: `//{current_host}:3001/hypothesis` });
  // Starts an additional dev web server to test cross-origin functionality
  serveDev(3002, { clientUrl: `//{current_host}:3001/hypothesis` });
});

gulp.task(
  'build',
  gulp.series(
    gulp.parallel('build-js', 'build-css', 'build-fonts', 'build-static-asset', 'build-client'),
    'build-boot-script',
    'build-client'
  )
);

gulp.task(
  'watch',
  gulp.parallel(
    'serve-package',
    'serve-test-pages',
    'watch-boot-script',
    'watch-css',
    'watch-fonts',
    'watch-js',
    'watch-static-asset',
    'watch-client'
  )
);

// Unit and integration testing tasks.
//
// Some (eg. a11y) tests rely on CSS bundles. We assume that JS will always take
// longer to build than CSS, so build in parallel.
gulp.task(
  'test',
  gulp.parallel('build-css', () =>
    runTests({
      bootstrapFile: 'src/sidebar/test/bootstrap.js',
      karmaConfig: 'src/karma.config.js',
      rollupConfig: 'rollup-tests.config.mjs',
      testsPattern: 'src/**/*-test.js',
    })
  )
);
