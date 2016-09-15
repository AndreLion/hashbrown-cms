'use strict';

let Entity = require('./Entity');

/**
 * The base class for all Schema types
 */
class Schema extends Entity {
    structure() {
        this.def(String, 'id');
        this.def(String, 'name');
        this.def(String, 'icon');
        this.def(String, 'parentSchemaId');
        this.def(Boolean, 'locked');
    }

    /**
     * Creates a new schema
     *
     * @param {Schema} parentSchema
     *
     * @returns {Schema} schema
     */
    static create(parentSchema) {
        return SchemaHelper.getModel({
            id: Entity.createId(),
            icon: 'file',
            type: parentSchema.type,
            parentSchemaId: parentSchema.id
        });
    }
}

module.exports = Schema;