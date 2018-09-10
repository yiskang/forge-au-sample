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

  class AdnMarkup3dTool extends AdnToolInterface {
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

    toggleVisible() {
      const n = this.markups.length;
      for( let i=0; i<n; ++i ) {
        const markupIcon = this.markupIcons[i];

        // Update markup visibility
        const show = !( markupIcon.style.display === 'block' );
        markupIcon.style.display = ( show ) ? 'block' : 'none';
      }
    }

    drawMarkup( pos3d, diameter, id ) {
      const viewer = this.viewer;
      diameter = diameter || 16;
      id = id || guid();

      const markup = {
        id,
        pos3d,
        diameter
      };

      this.markups.push( markup );

      const pos2d = viewer.worldToClient( pos3d );

      const markupIcon = document.createElement( 'div' );
      this.viewer.container.appendChild( markupIcon );
      this.markupIcons.push( markupIcon );

      const svgSize = diameter + 2;
      const circlePos = ( svgSize - diameter ) / 2;
      const markupSvg = SVG( markupIcon ).size( svgSize, svgSize );
      markupSvg.id = id;

      const circle = markupSvg.circle( diameter );
      circle.fill( '#FF8888' )
        .stroke( '#FF0000' )
        .attr( 'fill-opacity', 0.6 )
        .attr( 'stroke-width', 1.5 )
        .move( circlePos, circlePos );

      markupIcon.style.left =  pos2d.x - diameter / 2;
      markupIcon.style.top = pos2d.y - diameter / 2;
      //markupIcon.style.zIndex = 1000; //!<<< for debugging

      markupIcon.style.pointerEvents = 'none',
      markupIcon.style.width = `${ svgSize }px`;
      markupIcon.style.height = `${ svgSize }px`;
      markupIcon.style.position = 'absolute';
      markupIcon.style.overflow = 'visible';
      markupIcon.style.display = 'block';
      //markupIcon.style.border = '1px solid black'; //!<<< for debugging

      return markup;
    }

    removeMarkup( id ) {
      const idx = this.markups.findIndex( ( m ) => m.id === id );

      if( id === -1 )
        return console.warn( `No markup with id \`${ id }\`` );

      this.markups.splice( idx, 1 );
      const markupIcon = this.markupIcons[idx];
      markupIcon.parentNode.removeChild( markupIcon );
    }

    handleCameraUpdate() {
      const viewer = this.viewer;
      
      const n = this.markups.length;
      for( let i=0; i<n; ++i ) {
        const markup = this.markups[i];
        const markupIcon = this.markupIcons[i];

        // Get position in browser screen viewport
        const pos2d = viewer.worldToClient( markup.pos3d );

        // Update markup position
        markupIcon.style.left =  pos2d.x - markup.diameter / 2;
        markupIcon.style.top = pos2d.y - markup.diameter / 2;
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

      if( this.editMode ) {
        const markup = this.drawMarkup( result.intersectPoint.clone() );
        // Save new markup to server
        const srvUrl = getServerUrl();

        fetch( `${ srvUrl }/api/markups`, {
          method: 'post',
          body: JSON.stringify({
            serial: markup.id,
            pos3d: markup.pos3d.toArray(),
            diameter: markup.diameter
          }),
          headers: new Headers({
            'Content-Type': 'application/json'
          })
        })
          .then( ( response ) => {
            if( response.status === 200 || response.status === 201 ) {
              return response.json();
            } else {
              return console.error( new Error( response.statusText ) );
            }
          })
          .then( ( data ) => {
            if( !data ) return console.error( new Error( 'Failed to push the new markup to the server' ) );

            console.log( data );
          })
          .catch( ( error ) => console.error( new Error( error ) ) );
      }

      return true;
    }

    getState( viewerState ) {
      const markups = [];
  
      for( let id in this.markups ) {
        const markup = this.markups[id];

        markups.push({
          id: markup.id,
          pos3d: markup.pos3d.toArray(),
          diameter: markup.diameter
        });
      }

      viewerState.adnMarkup3d = {
        markups
      };
    }

    restoreState( viewerState ) {
      while( this.markups.length ) {
        const markup = this.markups.shift();
        this.removeMarkup( markup.id );
      }

      if( !viewerState.adnMarkup3d )
        return;

      const markups = viewerState.adnMarkup3d.markups;
      const n = markups.length;
      for( let i=0; i<n; ++i ) {
        const markup = markups[i];
        const pos3d = new THREE.Vector3().fromArray( markup.pos3d );
        this.drawMarkup( pos3d, markup.diameter, markup.id );
      }
    }
  }

  class AdnMarkup3dToolExtension extends Autodesk.Viewing.Extension {
    constructor( viewer, options ) {
      super( viewer, options );

      this.createUI = this.createUI.bind( this );
      this.onToolbarCreated = this.onToolbarCreated.bind( this );
      this.onModelLoaded = this.onModelLoaded.bind( this );
    }

    onToolbarCreated() {
      this.viewer.removeEventListener(
        Autodesk.Viewing.TOOLBAR_CREATED_EVENT,
        this.onToolbarCreated
      );

      this.createUI();
    }

    onModelLoaded() {
      this.viewer.removeEventListener(
        Autodesk.Viewing.GEOMETRY_LOADED_EVENT,
        this.onModelLoaded
      );

      const srvUrl = getServerUrl();

      fetch( `${ srvUrl }/api/markups`, {
        method: 'get',
        headers: new Headers({
          'Content-Type': 'application/json'
        })
      })
        .then( ( response ) => {
          if( response.status === 200 ) {
            return response.json();
          } else {
            return console.error( new Error( response.statusText ) );
          }
        })
        .then( ( data ) => {
          if( !data ) return console.error( new Error( 'Failed to fetch markups from the server' ) );

          console.log( 'Load markups', data );

          for( let i=0; i<data.length; ++i ) {
            const markup = data[i];
            const pos3d = new THREE.Vector3().fromArray( markup.pos3d );
            this.tool.drawMarkup( pos3d, markup.diameter, markup.serial );
          }
        })
        .catch( ( error ) => console.error( new Error( error ) ) );
    }

    createUI() {
      const viewer = this.viewer;
      const tool = this.tool;
      const avu = Autodesk.Viewing.UI;

      viewer.addEventListener(
        Autodesk.Viewing.GEOMETRY_LOADED_EVENT,
        this.onModelLoaded
      );

      const markupVisibilityButton = new avu.Button( 'toolbar-adnMarkupVisibilityTool' );
      markupVisibilityButton.setState( avu.Button.State.ACTIVE );
      markupVisibilityButton.setToolTip( 'Show Markups' );
      markupVisibilityButton.addClass( 'far' );
      markupVisibilityButton.setIcon( 'fa-eye' );
      markupVisibilityButton.onClick = function() {
        const state = markupVisibilityButton.getState();

        if( state === avu.Button.State.INACTIVE ) {
          markupVisibilityButton.setState( avu.Button.State.ACTIVE );
        } else if( state === avu.Button.State.ACTIVE ) {
          markupVisibilityButton.setState( avu.Button.State.INACTIVE );

          if( tool.isEditMode() ) {
            markupAddButton.setState( avu.Button.State.INACTIVE );
            tool.leaveEditMode();
          }
        }

        tool.toggleVisible();
      };

      const markupAddButton = new avu.Button( 'toolbar-adnMarkupAddTool' );
      markupAddButton.setToolTip( 'Add Markups' );
      markupAddButton.addClass( 'fas' );
      markupAddButton.setIcon( 'fa-plus' );
      markupAddButton.onClick = function() {
        const state = markupAddButton.getState();

        if( state === avu.Button.State.INACTIVE ) {
          markupAddButton.setState( avu.Button.State.ACTIVE );
          markupVisibilityButton.setState( avu.Button.State.ACTIVE );

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
      const tool = new AdnMarkup3dTool( this.viewer );
      viewer.toolController.registerTool( tool );
      viewer.toolController.activateTool( tool.getName() );
      this.tool = tool;

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
      this.viewer.toolController.deactivateTool( this.tool.getName() );
      this.viewer.toolController.deregisterTool( this.tool );
      this.tool = null;

      if( this.subToolbar ) {
        this.viewer.toolbar.removeControl( this.subToolbar );
        delete this.subToolbar;
        this.subToolbar = null;
      }

      return true;
    }

    getState( viewerState ) {
      this.tool.getState( viewerState );
    }

    restoreState( viewerState, immediate ) {
      this.tool.restoreState( viewerState, immediate );
    }
  }

  Autodesk.Viewing.theExtensionManager.registerExtension( 'Autodesk.ADN.Markup3dTool', AdnMarkup3dToolExtension );
})();