'use strict';

/**
 * The Controller for Schemas
 *
 * @memberof HashBrown.Server.Controllers
 */
class SchemaController extends require('./ApiController') {
    /**
     * Initialises this controller
     */
    static init(app) {
        app.get('/api/:project/:environment/schemas', this.middleware(), this.getSchemas);
        app.get('/api/:project/:environment/schemas/:id', this.middleware(), this.getSchema);
        
        app.post('/api/:project/:environment/schemas/pull/:id', this.middleware(), this.pullSchema);
        app.post('/api/:project/:environment/schemas/push/:id', this.middleware(), this.pushSchema);
        app.post('/api/:project/:environment/schemas/new', this.middleware({scope: 'schemas'}), this.createSchema);
        app.post('/api/:project/:environment/schemas/:id', this.middleware({scope: 'schemas'}), this.setSchema);
        
        app.delete('/api/:project/:environment/schemas/:id', this.middleware({scope: 'schemas'}), this.deleteSchema);
    }        
    
    /**
     * @example GET /api/:project/:environment/schemas
     *
     * @apiGroup Schema
     *
     * @param {String} project
     * @param {String} environment
     *
     * @returns {Array} Schemas
     */
    static getSchemas(req, res) {
        let getter = function() {
            if(req.query.customOnly) {
                return HashBrown.Helpers.SchemaHelper.getCustomSchemas(req.project, req.environment);
            } else {
                return HashBrown.Helpers.SchemaHelper.getAllSchemas(req.project, req.environment);
            }
        };

        getter()
        .then((schemas) => {
            res.status(200).send(schemas);
        })
        .catch((e) => {
            res.status(502).send(SchemaController.printError(e));
        });
    }
    
    /**
     * @example GET /api/:project/:environment/schemas/:id
     *
     * @apiGroup Schema
     *
     * @param {String} project
     * @param {String} environment
     * @param {String} id
     *
     * @returns {Schema} Schema
     */
    static getSchema(req, res) {
        return HashBrown.Helpers.SchemaHelper.getSchemaById(req.project, req.environment, req.params.id)
        .then((schema) => {
            res.status(200).send(schema);
        })
        .catch((e) => {
            res.status(502).send(SchemaController.printError(e));
        });
    }
    
    /**
     * @example POST /api/:project/:environment/schemas/:id
     *
     * @apiGroup Schema
     *
     * @param {String} project
     * @param {String} environment
     * @param {String} id
     *
     * @param {Schema} schema The Schema model to update
     *
     * @returns {Schema} Schema
     */
    static setSchema(req, res) {
        let id = req.params.id;
        let schema = HashBrown.Helpers.SchemaHelper.getModel(req.body);
        let shouldCreate = req.query.create == 'true' || req.query.create == true;

        HashBrown.Helpers.SchemaHelper.setSchemaById(req.project, req.environment, id, schema, shouldCreate)
        .then(() => {
            res.status(200).send(schema);
        })
        .catch((e) => {
            res.status(502).send(SchemaController.printError(e));
        });
    }
    
    /**
     * @example POST /api/:project/:environment/schemas/pull/:id
     *
     * @apiGroup Schema
     *
     * @param {String} project
     * @param {String} environment
     * @param {String} id
     *
     * @returns {Schema} The pulled Schema
     */
    static pullSchema(req, res) {
        let id = req.params.id;

        HashBrown.Helpers.SyncHelper.getResourceItem(req.project, req.environment, 'schemas', id)
        .then((resourceItem) => {
            if(!resourceItem) { return Promise.reject(new Error('Couldn\'t find remote Schema "' + id + '"')); }
        
            return HashBrown.Helpers.SchemaHelper.setSchemaById(req.project, req.environment, id, HashBrown.Helpers.SchemaHelper.getModel(resourceItem), true)
            .then(() => {
                res.status(200).send(resourceItem);
            });
        })
        .catch((e) => {
            res.status(404).send(SchemaController.printError(e));   
        }); 
    }
    
    /**
     * @example POST /api/:project/:environment/schemas/push/:id
     *
     * @apiGroup Schema
     *
     * @param {String} project
     * @param {String} environment
     * @param {String} id
     *
     * @returns {Schema} The pushed Schema
     */
    static pushSchema(req, res) {
        let id = req.params.id;

        HashBrown.Helpers.SchemaHelper.getSchemaById(req.project, req.environment, id)
        .then((localSchema) => {
            return HashBrown.Helpers.SyncHelper.setResourceItem(req.project, req.environment, 'schemas', id, localSchema);
        })
        .then(() => {
            res.status(200).send(id);
        })
        .catch((e) => {
            res.status(404).send(SchemaController.printError(e));   
        }); 
    }
    
    /**
     * @example POST /api/:project/:environment/schemas/new
     *
     * @apiGroup Schema
     *
     * @param {String} project
     * @param {String} environment
     *
     * @returns {Schema} The created Schema
     */
    static createSchema(req, res) {
        let parentSchema = HashBrown.Helpers.SchemaHelper.getModel(req.body);

        HashBrown.Helpers.SchemaHelper.createSchema(req.project, req.environment, parentSchema)
        .then((newSchema) => {
            res.status(200).send(newSchema.getObject());
        })
        .catch((e) => {
            res.status(502).send(SchemaController.printError(e));
        });
    }
    
    /**
     * @example DELETE /api/:project/:environment/schemas/:id
     *
     * @apiGroup Schema
     *
     * @param {String} project
     * @param {String} environment
     * @param {String} id
     */
    static deleteSchema(req, res) {
        let id = req.params.id;
        
        HashBrown.Helpers.SchemaHelper.removeSchemaById(req.project, req.environment, id)
        .then(() => {
            res.status(200).send('Schema with id "' + id + '" deleted successfully');
        })
        .catch((e) => {
            res.status(502).send(SchemaController.printError(e));
        });
    }
}

module.exports = SchemaController;
