'use strict';

const Entity = require('./Entity');

/**
 * A class for deploying and retrieving data to and from a server
 *
 * @memberof HashBrown.Common.Models
 */
class Deployer extends Entity {
    // Name and alias
    static get name() { return 'Deployer'; }
    static get alias() { return 'deployer'; }
    
    /**
     * Constructor
     */
    constructor(params) {
        super(params);

        this.name = this.constructor.name;
        this.alias = this.constructor.alias;

        if(!this.paths) { this.paths = {}; }
    }
    
    /**
     * Structure
     */
    structure() {
        this.def(String, 'name');
        this.def(String, 'alias');
        this.def(Object, 'paths', {
            media: '',
            content: ''
        });
    }

    /**
     * Gets the root path
     *
     * @returns {String} Root
     */
    getRootPath() {
        throw new Error('The method "getRootPath" must be overridden');
    }

    /**
     * Gets a deployment path
     *
     * @param {String} query
     * @param {String} filename
     *
     * @returns {String} Path
     */
    getPath(query, filename) {
        // The "query" variable is a syntax for getting the paths defined in the config
        let lvl1 = query ? query.split('/')[0] : null;
        let lvl2 = query ? query.split('/')[1] : null;
        
        // Start with the root path
        let path = this.getRootPath();
        
        // Add slash if needed
        if(path.lastIndexOf('/') !== path.length - 1) {
            path += '/';
        }
        
        // Add level 2 path if it exists
        if(lvl1 && lvl2 && this.paths[lvl1][lvl2] && typeof this.paths[lvl1][lvl2] === 'string') {
            path += this.paths[lvl1][lvl2];     
        } 
        
        // Add level 1 path if it exists
        else if(lvl1 && this.paths[lvl1] && typeof this.paths[lvl1] === 'string') {
            path += this.paths[lvl1];
        }
        
        // Add slash if needed
        if(path.lastIndexOf('/') !== path.length - 1) {
            path += '/';
        }

        // Add filename if needed
        if(filename) {
            path += filename;
        }

        // Remove any unwanted double slashes
        path = path.replace(/\/\//g, '/');

        // Add back double slashes for protocols
        path = path.replace(':/', '://');

        return path;
    }

    /**
     * Tests this deployment
     *
     * @returns {Promise} Result
     */
    test() {
        return Promise.reject(new Error('The "test" method should be overridden.'));
    }

    /**
     * Sets a file
     *
     * @param {String} path
     * @param {String} base64
     *
     * @returns {Promise} Result
     */
    setFile(path, content) {
        return Promise.reject(new Error('The "setFile" method should be overridden.'));
    }
    
    /**
     * Gets a file
     *
     * @param {String} path
     *
     * @returns {Promise} File
     */
    getFile(path) {
        return Promise.reject(new Error('The "getFile" method should be overridden.'));
    }
    
    /**
     * Removes a file
     *
     * @param {String} path
     *
     * @returns {Promise} Result
     */
    removeFile(path) {
        return Promise.reject(new Error('The "removeFile" method should be overridden.'));
    }
    
    /**
     * Gets a list of files
     *
     * @param {String} path
     *
     * @returns {Promise} Files
     */
    getFolder(path) {
        return Promise.reject(new Error('The "getFolder" method should be overridden.'));
    }
    
    /**
     * Removes a folder
     *
     * @param {String} path
     *
     * @returns {Promise} Result
     */
    removeFolder(path) {
        return Promise.reject(new Error('The "removeFolder" method should be overridden.'));
    }
    
}

module.exports = Deployer;
