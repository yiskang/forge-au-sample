//
// Copyright (c) Autodesk, Inc. All rights reserved
//
// Permission to use, copy, modify, and distribute this software in
// object code form for any purpose and without fee is hereby granted,
// provided that the above copyright notice appears in all copies and
// that both that copyright notice and the limited warranty and
// restricted rights notice below appear in all supporting
// documentation.
//
// AUTODESK PROVIDES THIS PROGRAM "AS IS" AND WITH ALL FAULTS.
// AUTODESK SPECIFICALLY DISCLAIMS ANY IMPLIED WARRANTY OF
// MERCHANTABILITY OR FITNESS FOR A PARTICULAR USE.  AUTODESK, INC.
// DOES NOT WARRANT THAT THE OPERATION OF THE PROGRAM WILL BE
// UNINTERRUPTED OR ERROR FREE.
//
// Forge AU Sample
// by Eason Kang - Autodesk Developer Network (ADN)
//

'use strict';

(function() {
  function getServerUrl() {
    return document.location.protocol + '//' + document.location.host;
  }

  //ref: https://github.com/Autodesk-Forge/library-javascript-viewer-extensions/blob/0c0db2d6426f4ff4aea1042813ed10da17c63554/src/components/UIComponent/UIComponent.js#L34
  function guid( format = 'xxxxxxxxxx' ) {

    let d = new Date().getTime();

    return format.replace(
      /[xy]/g,
      function( c ) {
        let r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c == 'x' ? r : (r & 0x7 | 0x8)).toString(16);
      });
  }

  class AdnToolInterface {
    constructor( viewer ) {
      this._viewer = viewer;
      this._active = false;
      this._names = [ 'unnamed' ];
    }
  
    get viewer() {
      return this._viewer;
    }

    getPriority() {
      return 0;
    }
  
    isActive() {
      return this._active;
    }
  
    getNames() {
      return this._names;
    }
  
    getName() {
      return this._names[0];
    }
  
    register() {
    }
  
    deregister() {
    }
  
    activate( name ) {
      this._active = true;
    }

    deactivate( name ) {
      this._active = false;
    }
  
    update( highResTimestamp ) {
      return false;
    }
  
    handleSingleClick( event, button ) {
      return false;
    }
  
    handleDoubleClick( event, button ) {
      return false;
    }
  
    handleSingleTap( event, button ) {
      return false;
    }
  
    handleDoubleTap( event, button ) {
      return false;
    }
  
    handleKeyDown( event, button ) {
      return false;
    }
  
    handleKeyUp( event, button ) {
      return false;
    }
  
    handleWheelInput( event, button ) {
      return false;
    }
  
    handleButtonDown( event, button ) {
      return false;
    }
  
    handleButtonUp( event, button ) {
      return false;
    }
  
    handleMouseMove( event, button ) {
      return false;
    }
  
    handleGesture( event, button ) {
      return false;
    }
  
    handleBlur( event, button ) {
      return false;
    }
  
    handleResize( event, button ) {
      return false;
    }
  }

  class AdnMarkup3dCreationTool extends AdnToolInterface {
    constructor( viewer ) {
      super( viewer );

      this._names = [ 'adn-markup-3d' ];
      this.markups = [];
      this.markupIcons = [];
      this.handleCameraUpdate = this.handleCameraUpdate.bind( this );
      this.editMode = false;
    }

    getPriority() {
      return 10;
    }

    isEditMode() {
      return this.editMode;
    }

    enterEditMode() {
      this.editMode = true;
    }

    leaveEditMode() {
      this.editMode = false;
    }

    activate() {
      this.viewer.addEventListener(
        Autodesk.Viewing.CAMERA_CHANGE_EVENT,
        this.handleCameraUpdate
      );
    }
    
    deactivate() {
      this.viewer.removeEventListener(
        Autodesk.Viewing.CAMERA_CHANGE_EVENT,
        this.handleCameraUpdate
      );
    }

    drawMarkup( pos3d, radius, id ) {
      const viewer = this.viewer;
      radius = radius || 12;
      id = id || guid();

      const markup = {
        id,
        pos3d,
        radius
      };

      this.markups.push( markup );

      const pos2d = viewer.worldToClient( pos3d );

      const markupIcon = document.createElement( 'div' );
      this.viewer.container.appendChild( markupIcon );
      this.markupIcons.push( markupIcon );
      //! Todo: create svg

      markupIcon.style.left =  pos2d.x - markup.radius * 2;
      markupIcon.style.top = pos2d.y - markup.radius;
      markupIcon.style.backgroundColor = 'red';
      markupIcon.style.zIndex = 1000;

      markupIcon.style.pointerEvents = 'none',
      markupIcon.style.width = '20px';
      markupIcon.style.height = '20px';
      markupIcon.style.position = 'absolute';
      markupIcon.style.overflow = 'visible';
    }

    handleCameraUpdate() {
      const viewer = this.viewer;
      
      const n = this.markups.length;
      for( let i=0; i<n; ++i ) {
        const markup = this.markups[i];
        const markupIcon = this.markupIcons[i];

        // Get position in screen viewport
        const pos2d = viewer.worldToClient( markup.pos3d );

        // Update SVG position
        markupIcon.style.left =  pos2d.x - markup.radius * 2;
        markupIcon.style.top = pos2d.y - markup.radius;
      }
    }

    handleSingleClick( event ) {
      const viewer = this.viewer;

      const viewport = viewer.container.getBoundingClientRect();
      const canvasX = event.clientX - viewport.left;
      const canvasY = event.clientY - viewport.top;

      //get the selected 3D position of the object
      const result = viewer.impl.hitTest( canvasX, canvasY, true );
      if( !result ) return true;

      if( this.editMode )
        this.drawMarkup( result.intersectPoint.clone() );

      return true;
    }
  }

  class AdnMarkup3dToolExtension extends Autodesk.Viewing.Extension {
    constructor( viewer, options ) {
      super( viewer, options );

      this.createUI = this.createUI.bind( this );
      this.onToolbarCreated = this.onToolbarCreated.bind( this );
    }

    onToolbarCreated() {
      this.viewer.removeEventListener(
        Autodesk.Viewing.TOOLBAR_CREATED_EVENT,
        this.onToolbarCreated
      );

      this.createUI();
    }

    createUI() {
      const viewer = this.viewer;
      const tool = this.creationTool;
      const avu = Autodesk.Viewing.UI;

      const markupVisibilityButton = new avu.Button( 'toolbar-adnMarkupVisibilityTool' );
      markupVisibilityButton.setToolTip( 'Show Markups' );
      markupVisibilityButton.addClass( 'far' );
      markupVisibilityButton.setIcon( 'fa-eye' );
      markupVisibilityButton.onClick = function() {

      };

      const markupAddButton = new avu.Button( 'toolbar-adnMarkupAddTool' );
      markupAddButton.setToolTip( 'Add Markups' );
      markupAddButton.addClass( 'fas' );
      markupAddButton.setIcon( 'fa-plus' );
      markupAddButton.onClick = function() {
        const state = markupAddButton.getState();

        if( state === avu.Button.State.INACTIVE ) {
          markupAddButton.setState( avu.Button.State.ACTIVE );

          tool.enterEditMode();
        } else if( state === avu.Button.State.ACTIVE ) {
          markupAddButton.setState( avu.Button.State.INACTIVE );

          tool.leaveEditMode();
        }
      };

      const subToolbar = new Autodesk.Viewing.UI.ControlGroup( 'toolbar-adn-tools' );
      subToolbar.addControl( markupVisibilityButton );
      subToolbar.addControl( markupAddButton );
      subToolbar.adnmarkupvisibilitybutton = markupVisibilityButton;
      subToolbar.adnmarkupaddbutton = markupAddButton;
      this.subToolbar = subToolbar;

      viewer.toolbar.addControl( this.subToolbar );
    }

    load() {
      const viewer = this.viewer;
      const tool = new AdnMarkup3dCreationTool( this.viewer );
      viewer.toolController.registerTool( tool );
      viewer.toolController.activateTool( tool.getName() );
      this.creationTool = tool;

      if( viewer.toolbar ) {
        // Toolbar is already available, create the UI
        this.createUI();
      } else {
        // Toolbar hasn't been created yet, wait until we get notification of its creation
        this.viewer.addEventListener(
          Autodesk.Viewing.TOOLBAR_CREATED_EVENT,
          this.onToolbarCreated
        );
      }

      return true;
    }

    unload() {
      this.viewer.toolController.deactivateTool( this.creationTool.getName() );
      this.viewer.toolController.deregisterTool( this.creationTool );
      this.creationTool = null;

      if( this.subToolbar ) {
        this.viewer.toolbar.removeControl( this.subToolbar );
        delete this.subToolbar;
        this.subToolbar = null;
      }

      return true;
    }
  }

  Autodesk.Viewing.theExtensionManager.registerExtension( 'Autodesk.ADN.Markup3dTool', AdnMarkup3dToolExtension );
})();