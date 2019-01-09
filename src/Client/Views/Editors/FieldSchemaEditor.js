'use strict';

/**
 * The editor for field Schemas
 *
 * @memberof HashBrown.Client.Views.Editors
 */
class FieldSchemaEditor extends HashBrown.Views.Editors.SchemaEditor {
    /**
     * Pre render
     */
    prerender() {
        if(!this.model.editorId && this.parentSchema) { 
            this.model.editorId = this.parentSchema.editorId;
        }
    }

    /**
     * Renders the field config editor
     *
     * @returns {HTMLElement} Editor element
     */
    renderFieldConfigEditor() {
        let editor = HashBrown.Views.Editors.FieldEditors[this.model.editorId];

        if(!editor) { return; }

        return _.div({class: 'config'},
            editor.renderConfigEditor(this.model.config, this.model.id)
        );
    }

    /**
     * Renders the editor fields
     */
    renderFields() {
        let $element = super.renderFields();
        
        $element.append(this.renderField('Field editor', new HashBrown.Views.Widgets.Dropdown({
            useTypeahead: true,
            value: this.model.editorId,
            options: HashBrown.Views.Editors.FieldEditors,
            valueKey: 'name',
            labelKey: 'name',
            onChange: (newEditor) => {
                this.model.editorId = newEditor;

                this.fetch();
            }
        }).$element));
        
        $element.append(this.renderField('Config', this.renderFieldConfigEditor(), true));

        return $element;
    }
}

module.exports = FieldSchemaEditor;
