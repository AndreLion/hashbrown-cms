'use strict';

// Lib
let beautify = require('js-beautify').js_beautify;

// Views
let MessageModal = require('./MessageModal');

/**
 * A basic JSON editor for any object
 */
class JSONEditor extends View {
    constructor(params) {
        super(params);

        this.$element = _.div({class: 'json-editor flex-vertical'});
        this.$error = _.div({class: 'panel panel-danger'}, [
            _.div({class: 'panel-heading'}),
            _.div({class: 'panel-body'})
        ]).hide();

        this.fetch();
    }

    /**
     * Event: Click reload. Fetches the model again
     */
    onClickReload() {
        this.fetch();
    }

    /**
     * Event: Click save. Posts the model to the modelUrl
     */
    onClickSave() {
        let view = this;

        try {
            this.model = JSON.parse(this.value);

            $.post(this.modelUrl, this.model, function() {
                console.log('[JSONEditor] Saved model to ' + view.modelUrl);
            });

        } catch(e) {
            new MessageModal({
                model: {
                    title: 'Invalid JSON',
                    body: e
                }
            });

        }
    }

    /**
     * Event: On click remove
     */
    onClickDelete() {
        let view = this;

        function onSuccess() {
            console.log('[PageEditor] Removed page with id "' + view.model.id + '"'); 
        
            reloadResource('pages')
            .then(function() {
                ViewHelper.get('NavbarMain').reload();
                
                // Cancel the JSONEditor view
                location.hash = '/pages/';
            });
        }

        new MessageModal({
            model: {
                title: 'Delete item',
                body: 'Are you sure you want to delete the item "' + (view.model.title || view.model.name || view.model.id) + '"?'
            },
            buttons: [
                {
                    label: 'Cancel',
                    class: 'btn-default',
                    callback: function() {
                    }
                },
                {
                    label: 'OK',
                    class: 'btn-danger',
                    callback: function() {
                        $.ajax({
                            url: '/api/pages/' + view.model.id,
                            type: 'DELETE',
                            success: onSuccess
                        });
                    }
                }
            ]
        });
    }

    /**
     * Event: Change text. Make sure the value is up to date
     */
    onChangeText($textarea) {
        this.value = $textarea.val();

        try {
            this.model = JSON.parse(this.value);
            this.$error.hide();

        } catch(e) {
            this.$error.children('.panel-heading').html('JSON error');
            this.$error.children('.panel-body').html(e);
            this.$error.show();
        }
    }

    render() {
        let view = this;

        this.value = beautify(JSON.stringify(this.model));

        this.$element.html([
            _.textarea({class: 'flex-expand'},
                this.value
            ).bind('keyup change propertychange paste', function() { view.onChangeText($(this)); }),
            this.$error,
            _.div({class: 'panel panel-default panel-buttons'}, 
                _.div({class: 'btn-group'}, [
                    _.button({class: 'btn btn-danger btn-raised'},
                        'Delete'
                    ).click(function() { view.onClickDelete(); }),
                    _.button({class: 'btn btn-raised btn-primary'},
                        'Reload'
                    ).click(function() { view.onClickReload(); }),
                    _.button({class: 'btn btn-raised btn-success'},
                        'Save '
                    ).click(function() { view.onClickSave(); })
                ])
            )
        ]);
    }
}

module.exports = JSONEditor;