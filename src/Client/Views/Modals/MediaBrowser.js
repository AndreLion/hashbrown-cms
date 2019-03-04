'use strict';

/**
 * A browser modal for Media objects
 *
 * @memberof HashBrown.Client.Views.Modals
 */
class MediaBrowser extends HashBrown.Views.Modals.Modal {
    constructor(params) {
        params = params || {};

        params.className = 'media-browser';
        params.title = 'Pick media'; 

        params.actions = [
            {
                label: 'OK',
                onClick: () => {
                    this.onClickOK();
                }
            }
        ];
        
        super(params);

        // Init the media picker mode inside the iframe
        let iframe = this.$element.find('iframe')[0];
            
        iframe.onload = () => {    
            iframe.contentWindow.HashBrown.Helpers.MediaHelper.initMediaPickerMode(
                (id) => { this.onPickMedia(id); },
                () => { this.onChangeResource(); },
                (e) => { UI.errorModal(e); },
                resources
            );
        };
    }

    /**
     * Event: Pick Media
     *
     * @param {string} id
     */
    onPickMedia(id) {
        this.value = id;
    }

    /** 
     * Event: Click OK
     */
    onClickOK() {
        if(this.value) {
            this.trigger('select', this.value);
        }

        this.close();
    }
    
    /** 
     * Event: Click cancel
     */
    onClickCancel() {
        this.close();
    }

    /**
     * Event: Change resource
     */
    onChangeResource() {
        HashBrown.Helpers.RequestHelper.reloadResource('media')
        .then(() => {
            HashBrown.Views.Navigation.NavbarMain.reload();
        });
    }

    /**
     * Render body
     *
     * @returns {HTMLElement} Body
     */
    renderBody() {
        return _.iframe({src: '//' + location.host  + '/' + HashBrown.Helpers.ProjectHelper.currentProject + '/' + HashBrown.Helpers.ProjectHelper.currentEnvironment + '/#/media/' + (this.value || '')});
    }
}

module.exports = MediaBrowser;
