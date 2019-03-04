'use strict';

/**
 * An editor for referencing Content Schemas
 *
 * @descripton Example:
 * <pre>
 * {
 *     "myContentSchemaReference": {
 *         "label": "My content schema reference",
 *         "tabId": "content",
 *         "schemaId": "contentSchemaReference",
 *         "config": {
 *             "allowedSchemas": "fromParent" || [ "myCustomSchema" ]
 *         }
 *     }
 * }
 * </pre>
 *
 * @memberof HashBrown.Client.Views.Editors.FieldEditors
 */
class ContentSchemaReferenceEditor extends HashBrown.Views.Editors.FieldEditors.FieldEditor {
    constructor(params) {
        super(params);
       
        // Adopt allowed Schemas from parent if applicable
        let parentSchema = this.getParentSchema();

        if(parentSchema && this.config && this.config.allowedSchemas == 'fromParent') {
            this.config.allowedSchemas = parentSchema.allowedChildSchemas;                            
        }

        this.fetch();
    }

    /**
     * Gets the parent Schema
     *
     * @returns {Schema} Parentn Schema
     */
    getParentSchema() {
        // Return config parent Schema if available
        if(this.config.parentSchema) { return this.config.parentSchema; }

        // Fetch current ContentEditor
        let contentEditor = Crisp.View.get('ContentEditor');

        if(!contentEditor) { return null; }

        // Fetch current Content model
        let thisContent = contentEditor.model;

        if(!thisContent) { return null; }
        
        // Fetch parent Content
        if(!thisContent.parentId) { return null; }
        
        let parentContent = HashBrown.Helpers.ContentHelper.getContentByIdSync(thisContent.parentId);

        if(!parentContent) {
            UI.errorModal(new Error('Content by id "' + thisContent.parentId + '" not found'));
            return null;
        }

        // Fetch parent Schema
        let parentSchema = HashBrown.Helpers.SchemaHelper.getSchemaByIdSync(parentContent.schemaId);
            
        if(!parentSchema) {
            UI.errorModal(new Error('Schema by id "' + parentContent.schemaId + '" not found'));
            return null;
        }

        // Return parent Schema
        return parentSchema;
    }

    /**
     * Gets schema types
     *
     * @returns {Array} List of options
     */
    getDropdownOptions() {
        let contentSchemas = [];

        for(let i in window.resources.schemas) {
            let schema = window.resources.schemas[i];
            let isNative = schema.id == 'page' || schema.id == 'contentBase';

            if(
                schema.type == 'content' &&
                !isNative &&
                (
                    !this.config ||
                    !this.config.allowedSchemas ||
                    !Array.isArray(this.config.allowedSchemas) ||
                    this.config.allowedSchemas.indexOf(schema.id) > -1
                )
            ) {
                contentSchemas[contentSchemas.length] = {
                    name: schema.name,
                    id: schema.id
                };
            }
        }

        return contentSchemas;
    }
    
    /**
     * Renders the config editor
     *
     * @param {Object} config
     *
     * @returns {HTMLElement} Element
     */
    static renderConfigEditor(config) {
        config.allowedSchemas = config.allowedSchemas || [];
        
        return _.div({class: 'editor__field'},
            _.div({class: 'editor__field__key'}, 'Allowed Schemas'),
            _.div({class: 'editor__field__value'},
                new HashBrown.Views.Widgets.Dropdown({
                    options: HashBrown.Helpers.SchemaHelper.getAllSchemasSync('content'),
                    useMultiple: true,
                    value: config.allowedSchemas,
                    useClearButton: true,
                    valueKey: 'id',
                    labelKey: 'name',
                    iconKey: 'icon',
                    onChange: (newValue) => {
                        config.allowedSchemas = newValue;
                    }
                }).$element
            )
        );
    }

    /**
     * Picks the first available Schema
     */
    pickFirstSchema() {
        let options = this.getDropdownOptions();

        if(options.length < 1) { return; }

        this.value = options[0].id;

        this.trigger('change', this.value);

        this.fetch();
    }

    /**
     * Renders this editor
     */
    template() {
        return _.div({class: 'field-editor field-editor--content-schema-reference'}, 
            new HashBrown.Views.Widgets.Dropdown({
                value: this.value,
                options: this.getDropdownOptions(),
                valueKey: 'id',
                tooltip: this.description || '',
                labelKey: 'name',
                iconKey: 'icon',
                useClearButton: true,
                onChange: (newValue) => {
                    this.value = newValue;

                    this.trigger('change', this.value);
                }
            }).$element
        );
    }
}

module.exports = ContentSchemaReferenceEditor;
