'use strict';

/**
 * A helper class for managing projects
 *
 * @memberof HashBrown.Server.Helpers
 */
class ProjectHelper {
    /**
     * Gets a list of all available project ids
     *
     * @returns {Promise} Array of Project names
     */
    static getAllProjectIds() {
        return HashBrown.Helpers.DatabaseHelper.listDatabases()
        .then((allDatabases) => {
            allDatabases = allDatabases || [];

            let allProjects = [];

            let checkNextProject = () => {
                let db = allDatabases.pop();

                if(!db) { return Promise.resolve(allProjects); }

                return this.projectExists(db)
                .then((projectExists) => {
                    if(projectExists) {
                        allProjects.push(db);
                    }

                    return checkNextProject();
                });
            };

            return checkNextProject();
        });
    }
    
    /**
     * Gets a list of all available projects
     *
     * @returns {Promise} Array of Projects
     */
    static getAllProjects() {
        return HashBrown.Helpers.DatabaseHelper.listDatabases()
        .then((allDatabases) => {
            allDatabases = allDatabases || [];

            let allProjects = [];

            let checkNextProject = () => {
                let db = allDatabases.pop();

                if(!db) {
                    allProjects.sort((a, b) => {
                        if(a.settings.info.name < b.settings.info.name) {
                            return -1;
                        }
                        
                        if(a.settings.info.name > b.settings.info.name) {
                            return 1;
                        }

                        return 0;
                    });

                    return Promise.resolve(allProjects);
                }

                return this.getProject(db)
                .then((project) => {
                    allProjects.push(project);

                    return checkNextProject();
                });
            };

            return checkNextProject();
        });
    }

    /**
     * Checks if a project exists
     *
     * @param {String} project
     *
     * @returns {Promise} Promise
     */
    static projectExists(project) {
        if(!project) { return Promise.resolve(false); }

        return HashBrown.Helpers.DatabaseHelper.collectionExists(project, 'settings');
    }
    
    /**
     * Checks if an environment exists
     *
     * @param {String} project
     * @param {String} environment
     *
     * @returns {Promise} Promise
     */
    static environmentExists(project, environment) {
        if(!environment) {
            return Promise.resolve(false);
        }
        
        return this.getAllEnvironments(project)
        .then((environments) => {
            return Promise.resolve(environments.indexOf(environment) > -1);
        });
    }

    /**
     * Performs a check of the requested project
     *
     * @param {String} project
     *
     * @returns {Promise} Result
     */
    static checkProject(project) {
        checkParam(project, 'project', String);

        return this.projectExists(project)
        .then((projectExists) => {
            if(!projectExists) {
                return Promise.reject(new Error('Project "' + project + '" could not be found'));
            }

            return Promise.resolve();
        });
    }

    /**
     * Toggles a Project settings "sync" section on/off
     *
     * @param {String} id
     * @param {Boolean} isEnabled
     *
     * @returns {Promise} Result
     */
    static toggleProjectSync(id, isEnabled) {
        checkParam(id, 'id', String);

        return HashBrown.Helpers.DatabaseHelper.findOne(id, 'settings', { usedBy: 'project' })
        .then((projectSettings) => {
            return Promise.resolve(projectSettings || { usedBy: 'project' });
        })
        .then((settings) => {
            settings.sync = settings.sync || {};

            if(typeof isEnabled !== 'boolean') {
                isEnabled = !settings.sync.enabled;
            }

            settings.sync.enabled = isEnabled;
            
            return HashBrown.Helpers.DatabaseHelper.updateOne(
                id,
                'settings',
                { usedBy: 'project' },
                settings,
                { upsert: true }
            );
        });
    }

    /**
     * Gets a Project object
     *
     * @param {String} id
     *
     * @returns {Promise} Project object
     */
    static getProject(id) {
        let settings;
        let users;
        let backups;

        return this.checkProject(id)
        .then(() => {
            return HashBrown.Helpers.SettingsHelper.getSettings(id);
        })
        .then((foundSettings) => {
            settings = foundSettings || {};

            return HashBrown.Helpers.UserHelper.getAllUsers(id);
        })
        .then((foundUsers) => {
            users = foundUsers;

            return HashBrown.Helpers.BackupHelper.getBackupsForProject(id);
        })
        .then((foundBackups) => {
            backups = foundBackups;

            return this.getAllEnvironments(id);
        })
        .then((foundEnvironments) => {
            let project = new HashBrown.Models.Project({
                id: id,
                backups: backups,
                settings: settings,
                environments: foundEnvironments,
                users: users
            });

            return Promise.resolve(project);
        });
    }

    /**
     * Gets a list of all available environments
     *
     * @param {String} project
     *
     * @returns {Promise(Array)} environments
     */
    static getAllEnvironments(project) {
        return this.checkProject(project)
        .then(() => {
            // First attempt to get remote environments
            return HashBrown.Helpers.SyncHelper.getResource(project, null, 'environments')
        })
        .then((environments) => {
            // If remote environments were found, resolve immediately
            if(environments && Array.isArray(environments)) {
                return Promise.resolve(environments);
            }

            // If remote environments were not found, return local ones
            return HashBrown.Helpers.DatabaseHelper.find(project, 'settings', {})
            .then((allSettings) => {
                let names = [];

                for(let setting of allSettings) {
                    if(!setting.usedBy || setting.usedBy === 'project') { continue; }

                    names.push(setting.usedBy);
                }

                // If we have some environments, resolve with them
                if(names.length > 0) {
                    return Promise.resolve(names);
                }

                // If we don't, make sure there is a "live" one
                // NOTE: Using the HashBrown.Helpers.DatabaseHelper directly here, since using the HashBrown.Helpers.SettingsHelper would create a cyclic call stack
                return HashBrown.Helpers.DatabaseHelper.insertOne(
                    project,
                    'settings',
                    { usedBy: 'live' },
                    { upsert: true }
                )
                .then(() => {
                    return Promise.resolve(['live']);  
                });
            });
        });
    }

    /**
     * Deletes a project
     *
     * @param {String} id
     * @param {Boolean} makeBackup
     *
     * @returns {Promise} Promise
     */
    static deleteProject(id, makeBackup = true) {
        checkParam(id, 'id', String);

        return this.checkProject(id)
        .then(() => {
            // Make backup first, if specified
            if(makeBackup) {
                return HashBrown.Helpers.BackupHelper.createBackup(id)
                .then(() => {
                    return HashBrown.Helpers.DatabaseHelper.dropDatabase(id);
                });

            // If not, just drop the database
            } else {
                return HashBrown.Helpers.DatabaseHelper.dropDatabase(id);
            }
        });
    }

    /**
     * Adds an environment
     *
     * @param {String} project
     * @param {String} environment
     *
     * @returns {Promise} New environment
     */
    static addEnvironment(project, environment) {
        checkParam(project, 'project', String);
        checkParam(environment, 'environment', String);

        return this.checkProject(project)
        .then(() => {
            // Check if project is synced first
            return HashBrown.Helpers.SettingsHelper.getSettings(project, null, 'sync');
        })
        .then((sync) => {
            if(sync.enabled) {
                return Promise.reject(new Error('Cannot add environments to a synced project'));
            }
            
            debug.log('Adding environment "' + environment + '" to project "' + project + '"...', this);
      
            return HashBrown.Helpers.SettingsHelper.setSettings(project, environment, null, {}, true);
        })
        .then(() => {
            return Promise.resolve(environment);  
        });
    }

    /**
     * Deletes an environment
     *
     * @param {String} project
     * @param {String} environment
     *
     * @returns {Promise} Promise
     */
    static deleteEnvironment(project, environment) {
        checkParam(project, 'project', String);
        checkParam(environment, 'environment', String);

        return this.checkProject(project)
        .then(() => {
            // Check if project is synced first
            return HashBrown.Helpers.SettingsHelper.getSettings(project, null, 'sync');
        })
        .then((sync) => {
            if(sync.enabled) {
                return Promise.reject(new Error('Cannot delete environments from a synced project'));
            }
        
            debug.log('Deleting environment "' + environment + '" from project "' + project + '"...', this);

            // Make a backup
            return HashBrown.Helpers.BackupHelper.createBackup(project);
        })

        // Get all collections with the environment prefix
        .then(() => {
            return HashBrown.Helpers.DatabaseHelper.listCollections(project);
        })

        // Iterate through collections and match them with the environment name
        .then((collections) => {
            let next = () => {
                let collection = collections.pop();

                // No more collections, resolve
                if(!collection) {
                    debug.log('Deleted environment "' + environment + '" from project "' + project + '" successfully', this);
                    return Promise.resolve();
                }

                // This collection matches the environment name, drop it
                if(collection.name.indexOf(environment + '.') == 0) {
                    return HashBrown.Helpers.DatabaseHelper.dropCollection(project, collection.name)
                    .then(() => {
                        return next();
                    });
                }

                // This collection does not match the environment name, iterate again 
                return next();
            }

            return next();
        })
        
        // Remove environment settings settings
        .then(() => {
            return HashBrown.Helpers.DatabaseHelper.remove(project, 'settings', { usedBy: environment });
        });
    }
    
    /**
     * Creates a new Project
     *
     * @param {String} name
     * @param {String} userId
     *
     * @returns {Promise} The new Project
     */
    static createProject(name, userId) {
        checkParam(name, 'name', String);
        checkParam(userId, 'userId', String);
        
        if(!name || !userId) {
            return Promise.reject(new Error('Projects cannot be created without a name and user id specified. Provided "' + name + '" and "' + userId + '"'));
        }
            
        let project = HashBrown.Models.Project.create(name);

        return HashBrown.Helpers.UserHelper.getUserById(userId)
        .then((user) => {
            if(!user.isAdmin) {
                return Promise.reject(new Error('Only admins can create projects'));
            }
            
            return this.projectExists(project.id);
        })
        .then((exists) => {
            if(exists === true) {
                return Promise.reject('A project by name "' + name + '" already exists');
            }

            return HashBrown.Helpers.DatabaseHelper.insertOne(project.id, 'settings', project.settings);
        })
        .then(() => {
            return Promise.resolve(project);
        });
    }
}

module.exports = ProjectHelper;
