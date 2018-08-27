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

  class AdnPropsPanel extends Autodesk.Viewing.Extensions.ViewerPropertyPanel {
    constructor( viewer ) {
      super( viewer );
    }

    getRemoteProps( dbId ) {
      return new Promise(( resolve, reject ) => {
        const srvUrl = getServerUrl();
        fetch( `${ srvUrl }/api/props?_expand=dataType&dbId=${ dbId }`, {
          method: 'get',
          headers: new Headers({
            'Content-Type': 'application/json'
          })
        })
          .then( ( response ) => {
            if( response.status === 200 ) {
              return response.json();
            } else {
              return reject( new Error( response.statusText ) );
            }
          })
          .then( ( data ) => {
            if( !data ) return reject( new Error( 'Failed to fetch properties from the server' ) );

            return resolve( data );
          })
          .catch( ( error ) => reject( new Error( error ) ) );
      });
    }

    getInfo( dbId ) {
      return new Promise(( resolve, reject ) => {
        this.viewer.getObjectTree(function( tree ) {
          const name = tree.getNodeName( dbId );
          return resolve( { dbId, name } );
        },
        function( code, msg ) {
          reject( { code, msg } );
        });
      });
    }

    async formatProps( dbId ) {
      const result = await this.getRemoteProps( dbId );
      const info = await this.getInfo( dbId );

      const props = [];
      for( let i=0; i < result.length; ++i ) {
        const data = result[i];
        props.push({
          attributeName: data.name,
          displayCategory: data.category,
          displayName: data.displayName,
          displayValue: data.value,
          hidden: data.flags & 1,
          precision: 0,
          type: data.dataType.serial,
          units: data.dataTypeContext
        });
      }

      return {
        dbId,
        name: info.name,
        properties: props
      };
    }

    async setNodeProperties( dbId ) {
      this.propertyNodeId = dbId;

      if( !this.viewer ) return;

      try {
        const result = await this.formatProps( dbId );

        this.setTitle( result.name, { localizeTitle: true } );
        this.setProperties( result.properties );

        this.resizeToContent();

        if( this.isVisible() ) {
          const toolController = this.viewer.toolController,
            mx = toolController.lastClickX,
            my = toolController.lastClickY,
            panelRect = this.container.getBoundingClientRect(),
            px = panelRect.left,
            py = panelRect.top,
            pw = panelRect.width,
            ph = panelRect.height,
            canvasRect = this.viewer.canvas.getBoundingClientRect(),
            cx = canvasRect.left,
            cy = canvasRect.top,
            cw = canvasRect.width,
            ch = canvasRect.height;

          if( (px <= mx && mx < px + pw) && (py <= my && my < py + ph) ) {
            if( (mx < px + (pw / 2)) && (mx + pw) < (cx + cw) ) {
              this.container.style.left = Math.round( mx - cx ) + 'px';
              this.container.dockRight = false;
            } else if( cx <= (mx - pw) ) {
              this.container.style.left = Math.round( mx - cx - pw ) + 'px';
              this.container.dockRight = false;
            } else if( (mx + pw) < (cx + cw) ) {
              this.container.style.left = Math.round( mx - cx ) + 'px';
              this.container.dockRight = false;
            } else if( (my + ph) < (cy + ch) ) {
              this.container.style.top = Math.round( my - cy ) + 'px';
              this.container.dockBottom = false;
            } else if( cy <= (my - ph) ) {
              this.container.style.top = Math.round( my - cy - ph ) + 'px';
              this.container.dockBottom = false;
            }
          }
        }
      } catch( error ) {
        this.showDefaultProperties();
      }
    }
  }

  class AdnPropsPanelExtension extends Autodesk.Viewing.Extension {
    constructor( viewer, options ) {
      super( viewer, options );

      this.panel = null;
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

      const propsPanel = new AdnPropsPanel( viewer );

      viewer.addPanel( propsPanel );
      this.panel = propsPanel;

      const propButton = new Autodesk.Viewing.UI.Button( 'toolbar-adnPropsTool' );
      propButton.setToolTip( 'Custom Properties' );
      propButton.setIcon( 'adsk-icon-properties' );
      propButton.onClick = function() {
        propsPanel.setVisible( !propsPanel.isVisible() );
      };

      const subToolbar = new Autodesk.Viewing.UI.ControlGroup( 'toolbar-adn-tools' );
      subToolbar.addControl( propButton );
      subToolbar.adnpropsbutton = propButton;
      this.subToolbar = subToolbar;

      viewer.toolbar.addControl( this.subToolbar );

      propsPanel.addVisibilityListener(function( visible ) {
        if( visible )
          viewer.onPanelVisible( propsPanel, viewer );

        propButton.setState( visible ? Autodesk.Viewing.UI.Button.State.ACTIVE : Autodesk.Viewing.UI.Button.State.INACTIVE );
      });
    }

    load() {
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
      if( this.panel ) {
        this.panel.uninitialize();
        delete this.panel;
        this.panel = null;
      }

      if( this.subToolbar ) {
        this.viewer.toolbar.removeControl( this.subToolbar );
        delete this.subToolbar;
        this.subToolbar = null;
      }

      return true;
    }
  }

  Autodesk.Viewing.theExtensionManager.registerExtension( 'Autodesk.ADN.PropsPanel', AdnPropsPanelExtension );
})();