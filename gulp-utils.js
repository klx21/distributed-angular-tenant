const lodash = require('lodash');
const chalk = require('chalk');
const fs = require('fs');
const gulp = require('gulp');
const gLoadPlugins = require('gulp-load-plugins');
const htmlMinifier = require('html-minifier');
const sass = require('sass');
const log = require('fancy-log');

const clientConfig = require("./client.config");
const folders = clientConfig.folders;
const filePaths = clientConfig.filePaths;

const gPlugins = gLoadPlugins({
    config: `${folders.projectRoot}/package.json`
});

const dev = gPlugins.environments.development;
const prod = gPlugins.environments.production;
const stage = gPlugins.environments.make("staging");

(function () {

    const ERROR_LEVELS = [
        "error",
        "warning"
    ];

    module.exports = {
        buildDepsTreeExp: buildDepsTreeExp,
        createFilesStream: createFilesStream,
        convertExtensions: convertExtensions,
        inProduction: inProduction,
        inStaging: inStaging,
        inDevelopment: inDevelopment,
        minifyTemplate: minifyTemplate,
        onError: onError,
        processScss: processScss,
        sortNg1AppJSFilesStream: sortNg1AppJSFilesStream,
        sortNg1CommonJSFilesStream: sortNg1CommonJSFilesStream
    };

    /**
     * Tells whether the build is being done in production mode.
     *
     * @returns {boolean} True if it"s in production mode. False otherwise.
     */
    function inProduction() {
        return prod();
    }

    function inStaging() {
        return stage();
    }

    function inDevelopment() {
        return dev();
    }

    /**
     * Create a sorted file stream from all the JS files in the "common" folder of the current folder "sCwd".
     *
     * @param sBase {string} The "base" option passed to the gulp.src() function.
     * @param sCwd {string} The "cwd" option passed to the gulp.src() function.
     * @returns {Stream} The file stream of all the JS files in the "common" folder of the current working directory
     *   "sCwd".
     */
    function sortNg1CommonJSFilesStream(sBase, sCwd) {
        return gulp
            .src(
                filePaths.ng1SrcCommonJSFiles, {
                    base: sBase,
                    cwd: sCwd
                }
            )
            .pipe(gPlugins.angularFilesort());
    }

    /**
     * Create a sorted file stream from all the JS files in the "app" folder of the current folder "sCwd".
     *
     * @param sBase {string} The "base" option passed to the gulp.src() function.
     * @param sCwd {string} The "cwd" option passed to the gulp.src() function.
     * @returns {Stream} The file stream of all the JS files in the "app" folder of the current working directory
     *     "sCwd".
     */
    function sortNg1AppJSFilesStream(sBase, sCwd) {
        return gulp
            .src(
                filePaths.ng1SrcAppJSFiles, {
                    base: sBase,
                    cwd: sCwd
                }
            )
            .pipe(gPlugins.angularFilesort());
    }

    /**
     * Build up the tree expression of the dependencies of the Angular 2 app. This is for the SystemJS bundling process.
     * The resulting tree expression denotes all modules other than spec files, source files and testing library files.
     * Refer to https://github.com/systemjs/builder/blob/master/docs/api.md#module-tree-expressions for more information
     * about SystemJS tree expressions.
     *
     * @returns {string} The tree expression of the dependencies of the Angular 2 app.
     */
    function buildDepsTreeExp() {
        return `css + ngApp + primeng/**/*.css - [ngApp/**/*.js]`;
    }

    /**
     * Minify template files before inlining them.
     *
     * @param {string} sPath Path to the template file.
     * @param {string} sExt The extension of the template file.
     * @param {string} sFileContent The content of the template file.
     * @param {function} fCb The callback function to be called when the asynchronous operation is done.
     */
    function minifyTemplate(sPath, sExt, sFileContent, fCb) {
        try {
            let oMinifiedFile = htmlMinifier.minify(sFileContent, {
                collapseWhitespace: true,
                caseSensitive: true,
                removeComments: true,
                removeRedundantAttributes: true
            });

            fCb(null, oMinifiedFile);
        } catch (oError) {
            log(oError);
            fCb(oError);
        }
    }

    /**
     * Remove the reference to all styling files from within Angular 2 app files.
     *
     * The reason for doing this is because all SCSS files are concatenated and transpiled together in another Gulp
     * task. And the transpiled CSS file will be loaded into the browser by a <link> tag. The code for handling SCSS
     * files is commented out because this is just temporary in order to ensure the compatibility of the styles for
     * both Angular
     * 1.x code and Angular 2 code. Once the conversion from Angular 1.x to Angular 2 is done this code can be
     * uncommented so that all styles will just be inlined in corresponding components.
     *
     * @param {string} sPath Path to the styling file.
     * @param {string} sExt The extension of the styling file.
     * @param {string} sFileContent The content of the styling file.
     * @param {function} fCb The callback function to be called when the asynchronous operation is done.
     */
    function processScss(sPath, sExt, sFileContent, fCb) {
        if (sExt.toString() === ".css") {
            let sScssPath = sPath.replace(/\.css$/, ".scss");
            try {
                // check scss version exists
                fs.accessSync(sScssPath, fs.F_OK);
                sExt = ".scss";
            } catch (oError) {
                log("Didn't find the scss version");
            }
        }
        /****************************************/
        /* KEEP the code that"s commented below */
        /****************************************/
        if (sExt.toString() === ".scss") {
          sass.render({
            data: sFileContent,
            includePaths: clientConfig.filePaths.ngSrcScssFile,
            sourceMap: true,
            outputStyle: 'compressed'
          }, (oError, oOutput) => {
            if (oError) {
              log(oError);
            }
            fCb(oError, oOutput ? oOutput.css.toString() : null);
          });
        } else {
          fCb(null, sFileContent);
        }
        // fCb(null, null);
    }

    /**
     * Change the extension of all ".css" files to ".scss" files.
     *
     * @param {string} sExt The extension of the file.
     * @param {string} sPath Path to the file.
     * @returns {string} The new file path.
     */
    function convertExtensions(sExt, sPath) {
        if (sExt.toString() === ".css") {
            let sScssPath = sPath.replace(/\.css$/, ".scss");
            try {
                // check if a SCSS file with the same name already exists
                fs.accessSync(sScssPath, fs.F_OK);
                return sScssPath;
            } catch (oError) {
                log("A SCSS file with the same name already exists in the path ", sScssPath);
            }
        }

        if (lodash.endsWith(sPath, "apimodeler.importswagger/apimodeler.importswagger.tpl.html")) {
            sPath = sPath.replace(/\/app\/ng-js-main/, "");
        }

        return sPath;
    }

    /**
     * Create a file stream from the given glob pattern and the current working directory.
     *
     * @param {string|array} asGlob The glob pattern to match against the files.
     * @param {string} sCwd The "cwd" option passed to the gulp.src() function.
     * @returns {Stream} The file stream containing the files matched by the glob pattern in the current working
     *   directory.
     */
    function createFilesStream(asGlob, sCwd) {
        if (!asGlob) {
            throw new Error("The glob pattern is not provided");
        }

        let options = {
            base: folders.tmp,
            read: false
        };

        if (sCwd) {
            options.cwd = sCwd;
        }

        return gulp.src(asGlob, options);
    }

    /**
     * Convenience handler for error-level errors.
     */
    function onError(error) {
        handleError.call(this, "error", error);
    }

    function isFatal(level) {
        return ERROR_LEVELS.indexOf(level) > -1;
    }

    /**
     * Handle an error based on its severity level.
     * Log all levels, and exit the process for fatal levels.
     */
    function handleError(level, error) {
        if (error.message) {
            log(chalk.magenta(error.message));
        }

        const neverExit = process.env.ENV && process.env.ENV.toLowerCase() === "dev";
        if (isFatal(level) && !neverExit) {
            process.exit(1);
        }
    }
})();
