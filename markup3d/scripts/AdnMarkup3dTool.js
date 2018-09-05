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
    }

    getPriority() {
      return 10;
    }

    handleSingleClick( event, button ) {
      const viewer = this.viewer;

      const viewport = viewer.container.getBoundingClientRect();
      const canvasX = event.clientX - viewport.left;
      const canvasY = event.clientY - viewport.top;

      //get the selected 3D position of the object
      const result = viewer.impl.hitTest( canvasX, canvasY, true );
      
      console.log( result );

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

          viewer.toolController.activateTool( tool.getName() );
        } else if( state === avu.Button.State.ACTIVE ) {
          markupAddButton.setState( avu.Button.State.INACTIVE );

          viewer.toolController.deactivateTool( tool.getName() );
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
      this.creationTool = new AdnMarkup3dCreationTool( this.viewer );
      this.viewer.toolController.registerTool( this.creationTool );

      if( this.viewer.toolbar ) {
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