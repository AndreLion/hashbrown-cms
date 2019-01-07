'use strict';

const NavbarPane = require('./NavbarPane');
const NavbarMain = require('./NavbarMain');
const MediaUploader = require('Client/Views/Modals/MediaUploader');
const ProjectHelper = require('Client/Helpers/ProjectHelper');
const MediaHelper = require('Client/Helpers/MediaHelper');
const RequestHelper = require('Client/Helpers/RequestHelper');

/**
 * The Media navbar pane
 * 
 * @memberof HashBrown.Client.Views.Navigation
 */
class MediaPane extends NavbarPane {
    /**
     * Event: On change folder path
     *
     * @param {String} newFolder
     */
    static onChangeDirectory(id, newFolder) {
        RequestHelper.request(
            'post',
            'media/tree/' + id,
            newFolder ? {
                id: id,
                folder: newFolder
            } : null
        )
        .then(() => {
            return RequestHelper.reloadResource('media');
        })
        .then(() => {
            NavbarMain.reload();

            location.hash = '/media/' + id;
        })
        .catch(UI.errorModal);
    }

    /**
     * Event: Click rename media
     */
    static onClickRenameMedia() {
        let $element = $('.context-menu-target'); 
        let id = $element.data('id');
        let name = $element.data('name');

        let modal = UI.messageModal(
            'Rename ' + name,
            new HashBrown.Views.Widgets.Input({
                type: 'text',
                value: name,
                onChange: (newValue) => { name = newValue; }
            }),
            () => {
                RequestHelper.request('post', 'media/rename/' + id + '?name=' + name)
                .then(() => {
                    return RequestHelper.reloadResource('media');
                })
                .then(() => {
                    NavbarMain.reload();

                    let mediaViewer = Crisp.View.get(HashBrown.Views.Editors.MediaViewer);

                    if(mediaViewer && mediaViewer.model && mediaViewer.model.id === id) {
                        mediaViewer.model = null;

                        mediaViewer.fetch();
                    }
                })
                .catch(UI.errorModal);
            }
        );

        modal.$element.find('input').focus();
    }

    /**
     * Event: Click remove media
     */
    static onClickRemoveMedia() {
        let $element = $('.context-menu-target'); 
        let id = $element.data('id');
        let name = $element.data('name');
        
        UI.confirmModal(
            'delete',
            'Delete media',
            'Are you sure you want to delete the media object "' + name + '"?',
            () => {
                $element.parent().toggleClass('loading', true);

                RequestHelper.request('delete', 'media/' + id)
                .then(() => {
                    return RequestHelper.reloadResource('media');
                })
                .then(() => {
                    NavbarMain.reload();

                    // Cancel the MediaViever view if it was displaying the deleted object
                    if(location.hash == '#/media/' + id) {
                        location.hash = '/media/';
                    }
                })
                .catch(UI.errorModal);
            }
        );
    }

    /**
     * Event: Click replace media
     */
    static onClickReplaceMedia() {
        let id = $('.context-menu-target').data('id');

        this.onClickUploadMedia(id);
    }

    /**
     * Event: Click upload media
     */
    static onClickUploadMedia(replaceId) {
        let folder = $('.context-menu-target').data('media-folder') || '/';

        new MediaUploader({
            onSuccess: (ids) => {
                // We got one id back
                if(typeof ids === 'string') {
                    location.hash = '/media/' + ids;

                // We got several ids back
                } else {
                    location.hash = '/media/' + ids[0];
                
                }

                // Refresh on replace
                if(replaceId) {
                    let mediaViewer = Crisp.View.get(HashBrown.Views.Editors.MediaViewer);

                    if(mediaViewer) {
                        mediaViewer.model = null;

                        mediaViewer.fetch();
                    }
                }
            },
            replaceId: replaceId,
            folder: folder
        });
    }
    
    /**
     * Init
     */
    static init() {
        NavbarMain.addTabPane('/media/', 'Media', 'file-image-o', {
            getItems: () => { return resources.media; },

            // Hierarchy logic
            hierarchy: (item, queueItem) => {
                let isSyncEnabled = HashBrown.Helpers.SettingsHelper.getCachedSettings(ProjectHelper.currentProject, null, 'sync').enabled;

                queueItem.$element.attr('data-media-id', item.id);
                queueItem.$element.attr('data-remote', true);
               
                if(item.folder) {
                    queueItem.createDir = true;
                    queueItem.parentDirAttr = { 'data-media-folder': item.folder };
                    queueItem.parentDirExtraAttr = { 'data-remote': isSyncEnabled };
                }
            },
            
            // Item context menu
            itemContextMenu: {
                'This media': '---',
                'Open in new tab': () => { this.onClickOpenInNewTab(); },
                'Move': () => { this.onClickMoveItem(); },
                'Rename': () => { this.onClickRenameMedia(); },
                'Remove': () => { this.onClickRemoveMedia(); },
                'Replace': () => { this.onClickReplaceMedia(); },
                'Copy id': () => { this.onClickCopyItemId(); },
                'General': '---',
                'Upload new media': () => { this.onClickUploadMedia(); },
                'Refresh': () => { this.onClickRefreshResource('media'); }
            },

            // Dir context menu
            dirContextMenu: {
                'Directory': '---',
                'Upload new media': () => { this.onClickUploadMedia(); },
                'General': '---',
                'Refresh': () => { this.onClickRefreshResource('media'); }
            },

            // General context menu
            paneContextMenu: {
                'Media': '---',
                'Upload new media': () => { this.onClickUploadMedia(); },
                'Refresh': () => { this.onClickRefreshResource('media'); }
            }
        });
    }
}

// Settings
MediaPane.canCreateDirectory = true;

module.exports = MediaPane;
