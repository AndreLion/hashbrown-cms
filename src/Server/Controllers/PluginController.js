'use strict';

const Glob = require('glob');
const FileSystem = require('fs');

/**
 * The controller for serving plugin content
 *
 * @memberof HashBrown.Server.Controllers
 */
class PluginController extends HashBrown.Controllers.Controller {
    /**
     * Initialises this controller
     */
    static init(app) {
        app.get('/js/plugins.js', this.getJs);
        app.get('/css/plugins.cs', this.getCss);
    }
    
    /**
     * Serves JS files
     */
    static getJs(req, res) {
        Glob(APP_ROOT + '/plugins/*/client/**/*.js', (err, paths) => {
            let compiledJs = '';

            for(let path of paths) {
                compiledJs += FileSystem.readFileSync(path, 'utf8');
            }

            res.set('Content-Type', 'text/javascript');
            res.send(compiledJs);
        });
    }
    
    /**
     * Serves CSS files
     */
    static getCss(req, res) {
        Glob(APP_ROOT + '/plugins/*/client/**/*.css', (err, paths) => {
            let compiledCss = '';

            for(let path of paths) {
                compiledCss += FileSystem.readFileSync(path, 'utf8');
            }

            res.set('Content-Type', 'text/css');
            res.send(compiledCss);
        });
    }
}

module.exports = PluginController;
