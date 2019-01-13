'use strict';

/**
 * The helper class for all synchronisation services
 *
 * @memberof HashBrown.Server.Helpers
 */
class SyncHelper {
    /**
     * Gets a new token
     *
     * @param {String} project
     * @param {String} username
     * @param {String} password
     *
     * @returns {Promise} New token
     */
    static renewToken(project, username, password) {
        checkParam(project, 'project', String);
        checkParam(username, 'username', String);
        checkParam(password, 'password', String);

        return HashBrown.Helpers.SettingsHelper.getSettings(project, '', 'sync')
        .then((settings) => {
            if(!this.validateSettings(settings, true)) {
                return Promise.reject(new Error('Sync URL not defined'));
            }

            debug.log('Renewing sync token for ' + project + '...', this);

            let postData = {
                username: username,
                password: password
            };
                
            return HashBrown.Helpers.RequestHelper.request('post', settings.url + 'user/login?persist=true', postData)
            .then((data) => {
                debug.log('Sync token renewed successfully', this);
                    
                return Promise.resolve(data);
            });
        });
    }
   
    /**
     * Validates the sync settings
     *
     * @param {Object} settings
     * @param {Boolean} justUrl
     *
     * @returns {Boolean} Whether the settings are valid
     */
    static validateSettings(settings, justUrl) {
        if(!justUrl) {
            if(!settings) { return false; }
            if(!settings.enabled) { return false; }
            if(!settings.token) { return false; }
            if(!settings.project) { return false; }
        }

        if(!settings.url) { return false; }
        if(settings.url.indexOf('http') !== 0) { return false; }

        return true;
    }

    /**
     * Get resource item
     *
     * @param {String} project
     * @param {String} environment
     * @param {String} remoteResourceName
     * @param {String} remoteItemName
     *
     * @returns {Promise} Resource
     */
    static getResourceItem(project, environment, remoteResourceName, remoteItemName) {
        checkParam(project, 'project', String);
        checkParam(environment, 'environment', String);
        checkParam(remoteResourceName, 'remoteResourceName', String);
        checkParam(remoteItemName, 'remoteItemName', String);

        if(!remoteItemName) {
            return this.getResource(project, environment, remoteResourceName);
        }

        return HashBrown.Helpers.SettingsHelper.getSettings(project, '', 'sync')
        .then((settings) => {
            if(this.validateSettings(settings)) {
                let path = settings.project;
                
                if(environment) {
                    path += '/' + environment;
                }

                let resource = remoteResourceName + '/' + remoteItemName;

                debug.log('Requesting remote resource item ' + resource + ' for ' + path + '...', this, 3);

                return HashBrown.Helpers.RequestHelper.request('get', settings.url + path + '/' + resource + '?token=' + settings.token)
                .then((data) => {
                    if(data instanceof Object) {
                        data.isLocked = true;

                        data.sync = {
                            isRemote: true,
                            hasRemote: false
                        };
                    }
                    
                    debug.log('Remote resource item ' + resource + ' retrieved successfully', this, 3);
                        
                    return Promise.resolve(data);
                })
                .catch((e) => {
                    if(e.message) {
                        debug.error('Unable to get resource item "' + remoteResourceName + '/' + remoteItemName + '" from project "' + project + '". Reason: ' + e.message + '. Disabling sync for this reason.', this);
                    }

                    return HashBrown.Helpers.ProjectHelper.toggleProjectSync(project, false)
                    .then(() => {
                        return Promise.resolve(null);
                    });
                });

            } else {
                return Promise.resolve(null);
            }
        });
    }

    /**
     * Set resource item
     *
     * @param {String} project
     * @param {String} environment
     * @param {String} remoteResourceName
     * @param {String} remoteItemName
     * @param {Object} remoteItemData
     *
     * @returns {Promise} Whether setting was successful
     */
    static setResourceItem(project, environment, remoteResourceName, remoteItemName, remoteItemData) {
        checkParam(project, 'project', String);
        checkParam(environment, 'environment', String);
        checkParam(remoteResourceName, 'remoteResourceName', String);
        checkParam(remoteItemName, 'remoteItemName', String);
        checkParam(remoteItemData, 'remoteItemData', Object);

        return HashBrown.Helpers.SettingsHelper.getSettings(project, '', 'sync')
        .then((settings) => {
            if(this.validateSettings(settings)) {
                let path = settings.project;
                
                if(environment) {
                    path += '/' + environment;
                }
                
                let resource = remoteResourceName;
                
                if(remoteItemName) {
                    resource += '/' + remoteItemName;
                }
                
                debug.log('Posting remote resource item ' + resource + ' for ' + path + '...', this, 3);
               
                let headers = {
                    'Content-Type': 'application/json'
                };
               
                // Send the API request, and make sure to create/upsert any resources that do not yet exist on the remote 
                return HashBrown.Helpers.RequestHelper.request('post', settings.url + path + '/' + resource + '?create=true&token=' + settings.token, remoteItemData)
                .then((data) => {
                    debug.log('Remote resource item ' + resource + ' posted successfully', this, 3);
                    
                    return Promise.resolve(true);
                });

            } else {
                return Promise.resolve(false);
            }
        });
    }

    /**
     * Get resource
     *
     * @param {String} project
     * @param {String} environment
     * @param {String} remoteResourceName
     * @param {Object} params
     *
     * @returns {Promise} Resource
     */
    static getResource(project, environment, remoteResourceName, params = {}) {
        checkParam(project, 'project', String);
        checkParam(environment, 'environment', String);
        checkParam(remoteResourceName, 'remoteResourceName', String);

        return HashBrown.Helpers.SettingsHelper.getSettings(project, '', 'sync')
        .then((settings) => {
            if(this.validateSettings(settings)) {
                let path = settings.project;
                
                if(environment) {
                    path += '/' + environment;
                }
                
                debug.log('Requesting remote resource ' + remoteResourceName + ' for ' + path + '...', this, 3);
                
                params.token = settings.token;
              
                return HashBrown.Helpers.RequestHelper.request('get', settings.url + path + '/' + remoteResourceName, params)
                .then((data) => {
                    debug.log('Remote resource ' + remoteResourceName + ' retrieved successfully', this, 3);
                        
                    return Promise.resolve(data);
                })
                .catch((e) => {
                    if(e.message) {
                        debug.error('Unable to get resource "' + remoteResourceName + '" from project "' + project + '". Reason: ' + e.message + '. Disabling sync for this reason.', this);
                    }

                    return HashBrown.Helpers.ProjectHelper.toggleProjectSync(project, false)
                    .then(() => {
                        return Promise.resolve(null);
                    });
                });

            } else {
                return Promise.resolve(null);
            }
        });
    }

    /**
     * Merges a resource with a synced one
     *
     * @param {String} project
     * @param {String} environment
     * @param {String} remoteResourceName
     * @param {Array} localResource
     * @param {Object} params
     *
     * @return {Promise} Merged resource
     */
    static mergeResource(project, environment, remoteResourceName, localResource, params = {}) {
        checkParam(project, 'project', String);
        checkParam(environment, 'environment', String);
        checkParam(remoteResourceName, 'remoteResourceName', String);
        checkParam(localResource, 'localResource', Array);

        return this.getResource(project, environment, remoteResourceName, params)
        .then((remoteResource) => {
            let mergedResource;

            if(remoteResource) {
                // Cache ids to look for duplicates
                let remoteIds = {};
                let duplicateIds = {};
                
                for(let r in remoteResource) {
                    let remoteItem = remoteResource[r];

                    if(!remoteItem) {
                        debug.log('"' + r + '" in remote resource "' + remoteResourceName + '" is null', this);

                    } else if(typeof remoteItem !== 'object') {
                        debug.log('"' + r + '" in remote resource "' + remoteResourceName + '" is not an object: ' + remoteItem, this);

                    } else {
                        // Remove old variable names
                        delete remoteItem.locked;
                        delete remoteItem.remote;
                        delete remoteItem.local;

                        remoteItem.isLocked = true;

                        remoteItem.sync = {
                            isRemote: true,
                            hasRemote: false
                        };

                        remoteIds[remoteItem.id] = true;

                    }
                }

                // Look for duplicates and flag local nodes
                for(let l in localResource) {
                    let localItem = localResource[l];

                    if(remoteIds[localItem.id] == true) {
                        localItem.isLocked = false;

                        localItem.sync = {
                            isRemote: false,
                            hasRemote: true
                        };

                        duplicateIds[localItem.id] = true;
                    }
                }

                // Make sure remote resource is array
                if(remoteResource instanceof Object && remoteResource instanceof Array === false) {
                    remoteResource = Object.values(remoteResource);   
                }
                
                if(remoteResource instanceof Array === false) {
                    return Promise.reject(new Error('The remote resource "' + remoteResourceName + '" was not an array'));
                }
                
                // Make sure local resource is array
                if(localResource instanceof Object && remoteResource instanceof Array === false) {
                    localResource = Object.values(localResource);   
                }

                if(localResource instanceof Array === false) {
                    return Promise.reject(new Error('The local resource "' + remoteResourceName + '" was not an array'));
                }

                // Merge resources
                mergedResource = [];
                
                for(let v of remoteResource) {
                    if(duplicateIds[v.id] == true) { continue; }

                    mergedResource[mergedResource.length] = v;
                }
                
                for(let v of localResource) {
                    mergedResource[mergedResource.length] = v;
                }
            
            } else {
                mergedResource = localResource;

            }

            return Promise.resolve(mergedResource);
        });
    }
}

module.exports = SyncHelper;
