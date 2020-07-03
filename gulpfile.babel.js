const del = require('del');
const gulp = require('gulp');
const gLoadPlugins = require('gulp-load-plugins');
const lazypipe = require('lazypipe');
const lodash = require('lodash');
const {rollup} = require('rollup');
const rollupCommonJs = require('@rollup/plugin-commonjs');
const rollupNodeResolve = require('@rollup/plugin-node-resolve').default;
const rollupSourcemaps = require('rollup-plugin-sourcemaps');
const rollupTerser = require('rollup-plugin-terser');
const merge = require('merge2');

const clientConfig = require('./client.config');
const utils = require('./gulp-utils');

const moduleNames = clientConfig.moduleNames;
const singleFolderNames = clientConfig.singleFolderNames;
const folders = clientConfig.folders;
const fileNames = clientConfig.fileNames;
const filePaths = clientConfig.filePaths;

const gPlugins = gLoadPlugins({
  config: `${ folders.projectRoot }/package.json`
});
const tsCoreProject = gPlugins.typescript.createProject(`${ folders.client }/tsconfig.json`);
const tsCommonProject = gPlugins.typescript.createProject(`${ folders.common }/tsconfig.common.json`);

const cleanUpAll = gulp.parallel(
  cleanTmpCoreBundle,
  cleanTmpTranspiledClient,
  cleanTmpNgDependencies,
  cleanServer
);

const transpileClient = gulp.series(
  cleanTmpTranspiledClient,
  doTsLintClient,
  doTranspileClient
);

const transpileCommon = gulp.series(
  cleanTmpTranspiledCommon,
  doTsLintCommon,
  doTranspileCommon
);

const bundleCommon = gulp.series(
  cleanTmpCommonBundle,
  transpileCommon,
  doBundleCommon,
  removeCommonSrcFiles
);

const bundleApp = gulp.series(
  cleanTmpCoreBundle,
  transpileClient,
  bundleCommon,
  doBundleApp,
  removeCoreClientFiles
);

const bundleRxjsOperators = gulp.series(
  cleanTmpRxjsOperatorsBundle,
  doBundleRxjsOperators
);

const bundleTenant = gulp.series(
    cleanTmpTenantBundle,
    transpileClient,
    bundleCommon,
    doBundleTenantApp
);

const copyDaConfig = gulp.series(
  cleanTmpDaConfig,
  copyDaConfigFile
);

const copyDependencies = gulp.series(
  cleanTmpVendor,
  copyVendors
);

const prepareNgFiles = gulp.series(
  bundleApp,
  bundleRxjsOperators,
  bundleTenant,
  copyDaConfig,
  copyDependencies,
  copyPrerequisites
);

const injectIndexHtml = gulp.series(
  prepareNgFiles,
  doInjectStaticResource
);

const distUi = gulp.series(
  injectIndexHtml,
  doDistUiFiles
);

const npmInstall = gulp.series(
  copyPackageJson,
  doNpmInstall
);

const distServer = gulp.series(
  cleanServer,
  gulp.parallel(
    npmInstall,
    doDistServerFiles
  )
);

/* Exported tasks */
lodash.assign(exports, {
  bundleApp,
  bundleCommon,
  bundleRxjsOperators,
  bundleTenant,
  cleanUpAll,
  copyDependencies,
  dist: gulp.parallel(
    distUi,
    distServer
  ),
  distServer,
  distUi,
  injectIndexHtml,
  npmInstall,
  prepareNgFiles,
  transpileClient,
  transpileCommon
});

/************** Function declarations start from here on **************/

function cleanServer() {
  return del(folders.distServer);
}

/**
 * Remove the Angular 2 app files including the "ng2-app.bundle.js" file and the "ng2-app.bundle.min.js" file as well as
 * the corresponding source map files from the "tmp" folder.
 */
function cleanTmpCoreBundle() {
  return del(`${ fileNames.findAllBundleFiles(moduleNames.core) }`, {
    cwd: folders.tmpBundles
  });
}

function cleanTmpCommonBundle() {
  return del(`${ fileNames.findAllBundleFiles(moduleNames.common) }`, {
    cwd: folders.tmpBundles
  });
}

function cleanTmpDaConfig() {
  return del('da-config.json', {
    cwd: folders.tmp
  });
}

/**
 * Remove the Angular 2 dependency files including the "ng2-deps.bundle.js" file and the "ng2-deps.bundle.min.js" file,
 * as well as the corresponding source map files from the "tmp" folder.
 */
function cleanTmpNgDependencies() {
  return del([
    ...[
      fileNames.depsJSFile,
      fileNames.depsJSFile + '.map',
      fileNames.minDepsJSFile,
      fileNames.minDepsJSFile + '.map'
    ],
    ...filePaths.ngDepsToCopy
  ], {
    cwd: folders.tmp
  });
}

function cleanTmpRxjsOperatorsBundle() {
  return del(`${ fileNames.findAllBundleFiles(moduleNames.rxjsOperators) }`, {
    cwd: folders.tmpBundles
  });
}

function cleanTmpTenantBundle() {
  return del(`${ fileNames.findAllBundleFiles(moduleNames.tenant) }`, {
    cwd: folders.tmpBundles
  });
}

/*
* Remove the "client" folder from the "tmp" folder. This "client" folder is for containing all JavaScript files that
* are transpiled from the Typescript source code.
*/
function cleanTmpTranspiledClient() {
  return del(folders.tmpSrc);
}

function cleanTmpTranspiledCommon() {
  return del(folders.tmpCommon);
}

function cleanTmpVendor() {
  return del(folders.tmpVendor);
}

function constructImportmaps() {
  const aScriptTagForImportmaps = [
    '<script type="systemjs-importmap">',
    '</script>'
  ];
  const oImportmaps = {
    imports: {
      [moduleNames.common]: `${ singleFolderNames.bundles }/${ moduleNames.common }.bundle${utils.inProduction() ? '.min' : ''}.js`,
      [moduleNames.core]: `${ singleFolderNames.bundles }/${ moduleNames.core }.bundle${ utils.inProduction() ? '.min' : '' }.js`,
      '@angular/core': `${ singleFolderNames.vendor }/@angular/core/bundles/core.umd${ utils.inProduction() ? '.min' : '' }.js`,
      '@angular/common': `${ singleFolderNames.vendor }/@angular/common/bundles/common.umd${ utils.inProduction() ? '.min' : '' }.js`,
      '@angular/common/http': `${ singleFolderNames.vendor }/@angular/common/bundles/common-http.umd${ utils.inProduction() ? '.min' : '' }.js`,
      '@angular/router': `${ singleFolderNames.vendor }/@angular/router/bundles/router.umd${ utils.inProduction() ? '.min' : '' }.js`,
      '@angular/compiler': `${ singleFolderNames.vendor }/@angular/compiler/bundles/compiler.umd${ utils.inProduction() ? '.min' : '' }.js`,
      '@angular/forms': `${ singleFolderNames.vendor }/@angular/forms/bundles/forms.umd${ utils.inProduction() ? '.min' : '' }.js`,
      '@angular/platform-browser': `${ singleFolderNames.vendor }/@angular/platform-browser/bundles/platform-browser.umd${ utils.inProduction() ? '.min' : '' }.js`,
      '@angular/platform-browser-dynamic': `${ singleFolderNames.vendor }/@angular/platform-browser-dynamic/bundles/platform-browser-dynamic.umd${ utils.inProduction() ? '.min' : '' }.js`,
      '@ngx-translate/core': `${ singleFolderNames.vendor }/@ngx-translate/core/bundles/ngx-translate-core.umd${ utils.inProduction() ? '.min' : '' }.js`,
      '@ngx-translate/http-loader': `${ singleFolderNames.vendor }/@ngx-translate/http-loader/bundles/ngx-translate-http-loader.umd${ utils.inProduction() ? '.min' : '' }.js`,
      'rxjs': `${ singleFolderNames.vendor }/rxjs/bundles/rxjs.umd${ utils.inProduction() ? '.min' : '' }.js`,
      'rxjs/operators': `${ singleFolderNames.bundles }/${ moduleNames.rxjsOperators }.bundle${ utils.inProduction() ? '.min' : '' }.js`
    }
  };

  aScriptTagForImportmaps.splice(1, 0, JSON.stringify(oImportmaps))

  return aScriptTagForImportmaps.join('');
}

function copyDaConfigFile() {
  return gulp
    .src('da-config.json', {
      cwd: folders.client
    })
    .pipe(gulp.dest(folders.tmp));
}

function copyPackageJson() {
  return gulp
    .src(fileNames.packageJson, {
      base: folders.projectRoot,
      cwd: folders.projectRoot
    })
    .pipe(gulp.dest(folders.dist));
}

function copyPrerequisites() {
  return gulp
    .src([
      ...filePaths.prerequisiteCSSFiles,
      ...filePaths.prerequisiteFontFiles,
      ...filePaths.prerequisiteJSFiles,
      ...filePaths.prerequisiteSourcemapFiles
    ], {
      base: folders.nodeModulesPrefix,
      cwd: folders.nodeModulesPrefix
    })
    .pipe(gulp.dest(folders.tmpPrereq));
}

function copyVendors() {
  return gulp
    .src(lodash.map(filePaths.ngDepsToCopy, path => `${ path }/**/*`), {
      base: folders.nodeModulesPrefix,
      cwd: folders.nodeModulesPrefix
    })
    .pipe(gulp.dest(folders.tmpVendor));
}

function doBundleApp() {
  const outputOptions = {
    format: 'systemjs',
    sourcemap: true
  };

  return rollup({
    input: `${ folders.tmpSrc }/main.js`,
    plugins: [
      rollupSourcemaps(),
      rollupNodeResolve(),
      rollupCommonJs()
    ],
    external: id => lodash.includes(id, 'node_modules') || !/^\.?\.?\//.test(id),
    treeshake: true
  })
    .then(bundle => Promise.all([
      bundle.write(lodash.assign({}, outputOptions, {
        file: `${ folders.tmpBundles }/${ fileNames.nameBundleFile(moduleNames.core) }`
      })),
      bundle.write(lodash.assign({}, outputOptions, {
        compact: true,
        file: `${ folders.tmpBundles }/${ fileNames.nameMinBundleFile(moduleNames.core) }`,
        plugins: [
          rollupTerser.terser()
        ]
      }))
    ]))
    .catch(utils.onError);
}

function doBundleCommon() {
  const outputOptions = {
    format: 'umd',
    name: moduleNames.common,
    sourcemap: true
  };

  return rollup({
    input: `${ folders.tmpCommon }/index.js`,
    plugins: [
      rollupSourcemaps(),
      rollupNodeResolve(),
      rollupCommonJs()
    ],
    external: id => lodash.includes(id, 'node_modules') || !/^\.?\.?\//.test(id),
    treeshake: true
  })
    .then(bundle => Promise.all([
      bundle.write(lodash.assign({}, outputOptions, {
        file: `${ folders.tmpBundles }/${ fileNames.nameBundleFile(moduleNames.common) }`
      })),
      bundle.write(lodash.assign({}, outputOptions, {
        compact: true,
        file: `${ folders.tmpBundles }/${ fileNames.nameMinBundleFile(moduleNames.common) }`,
        plugins: [
          rollupTerser.terser()
        ]
      }))
    ]))
    .catch(utils.onError);
}

function doBundleRxjsOperators() {
  const outputOptions = {
    format: 'umd',
    name: moduleNames.rxjsOperators,
    sourcemap: true
  };

  return rollup({
    input: `${ folders.nodeModulesPrefix }/rxjs/operators/index.js`,
    plugins: [
      rollupSourcemaps(),
      rollupNodeResolve(),
      rollupCommonJs()
    ],
    treeshake: false
  })
    .then(builder => {
      return Promise.all([
        builder.write(lodash.assign({}, outputOptions, {
          file: `${ folders.tmpBundles }/${ fileNames.nameBundleFile(moduleNames.rxjsOperators) }`
        })),
        builder.write(lodash.assign({}, outputOptions, {
          file: `${ folders.tmpBundles }/${ fileNames.nameMinBundleFile(moduleNames.rxjsOperators) }`,
          plugins: [
            rollupTerser.terser()
          ]
        }))
      ]);
    })
    .catch(utils.onError);
}

function doBundleTenantApp() {
  const outputOptions = {
    format: 'umd',
    name: moduleNames.tenant,
    sourcemap: true
  };

  return rollup({
    input: `${ folders.tmpSrc }/app/ng-tenant-app.module.js`,
    plugins: [
      rollupSourcemaps(),
      rollupNodeResolve(),
      rollupCommonJs()
    ],
    external: id => lodash.includes(id, 'node_modules') || !/^\.?\.?\//.test(id),
    treeshake: true
  })
      .then(bundle => Promise.all([
        bundle.write(lodash.assign({}, outputOptions, {
          file: `${ folders.tmpBundles }/${ fileNames.nameBundleFile(moduleNames.tenant) }`
        })),
        bundle.write(lodash.assign({}, outputOptions, {
          compact: true,
          file: `${ folders.tmpBundles }/${ fileNames.nameMinBundleFile(moduleNames.tenant) }`,
          plugins: [
            rollupTerser.terser()
          ]
        }))
      ]))
      .catch(utils.onError);
}

function doDistServerFiles() {
  return gulp
    .src('*', {
      base: folders.projectRoot,
      cwd: folders.server
    })
    .pipe(gulp.dest(folders.dist));
}

function doDistUiFiles() {
  return gulp
    .src([
      '*',
      '*/**'
    ], {
      base: folders.tmp,
      cwd: folders.tmp
    })
    .pipe(gulp.dest(folders.distClient));
}

function doInjectStaticResource() {
  const prerequisiteCssFileStream = utils.createFilesStream(
    filePaths.prerequisiteCSSFiles,
    folders.tmpPrereq
  );
  const prerequisiteJsFileStream = utils.createFilesStream(
    filePaths.prerequisiteJSFiles,
    folders.tmpPrereq
  );

  return gulp
    .src('index.html', {
      base: folders.srcClient,
      cwd: folders.srcClient
    })
    .pipe(gulp.dest(folders.tmp))
    .pipe(gPlugins.injectString.replace(
      '<!-- importmaps:json -->',
      constructImportmaps()
    ))
    .pipe(gPlugins.inject(merge(prerequisiteCssFileStream, prerequisiteJsFileStream), {
      name: 'prerequisite',
      relative: true
    }))
    .pipe(gPlugins.injectString.replace(
      '<!-- bootstrap-app -->',
      `<script type="text/javascript">System.import('${moduleNames.core}')</script>`
    ))
    .pipe(gulp.dest(folders.tmp));
}

function doNpmInstall() {
  return gPlugins
    .runCommand
    .default(
      '/home/huanli/.nvm/versions/node/v10.20.1/bin/node /home/huanli/.nvm/versions/node/v10.20.1/bin/npm i --production',
      {
        cwd: folders.dist
      }
    )();
}

function doTranspileClient() {
  const srcFileStream = gulp
    .src(filePaths.ngCoreSrcTSFiles, {
      base: folders.srcClient,
      cwd: folders.srcClient
    });
  const envFileStream = gulp
    .src(`environments/environment${ utils.inProduction() ? '.prod' : '' }.ts`, {
      base: folders.srcClient,
      cwd: folders.srcClient
    })
    .pipe(gPlugins.if(utils.inProduction(), gPlugins.rename('environments/environment.ts')));

  return merge(srcFileStream, envFileStream)
    .pipe(gPlugins.sourcemaps.init())
    .pipe(gPlugins.inlineNg2Template({
      base: folders.srcClient,
      useRelativePaths: true,
      removeLineBreaks: true,
      templateProcessor: utils.minifyTemplate,
      customFilePath: utils.convertExtensions,
      styleProcessor: utils.processScss
    }))
    .pipe(tsCoreProject(gPlugins.typescript.reporter.fullReporter(true)))
    .pipe(gPlugins.sourcemaps.write('.'))
    .pipe(gulp.dest(folders.tmpSrc))
    .on('error', utils.onError);
}

function doTranspileCommon() {
  return gulp
    .src(filePaths.allSrc, {
      cwd: folders.common
    })
    .pipe(gPlugins.sourcemaps.init())
    .pipe(tsCommonProject(gPlugins.typescript.reporter.fullReporter(true)))
    .pipe(gPlugins.sourcemaps.write('.'))
    .pipe(gulp.dest(folders.tmpCommon));
}

/**
 * Lint our source code in Typescript, which is in the "server_express" folder for now, and generate a report.
 */
function doTsLintClient() {
  return gulp
    .src(filePaths.ngCoreSrcTSFiles, {
      cwd: folders.client
    })
    .pipe(gPlugins.tslint({
      configuration: `${ folders.projectRoot }/tslint.json`
    }))
    .pipe(gPlugins.tslint.report({
      emitError: false
    }))
    .on('error', utils.onError);
}

function doTsLintCommon() {
  return gulp
    .src(filePaths.allSrc, {
      cwd: folders.common
    })
    .pipe(gPlugins.tslint({
      configuration: `${ folders.projectRoot }/tslint.json`
    }))
    .pipe(gPlugins.tslint.report({
      emitError: false
    }))
    .on('error', utils.onError);
}

function removeCommonSrcFiles() {
 return del(folders.tmpCommon);
}

function removeCoreClientFiles() {
  return del(folders.tmpSrc);
}
