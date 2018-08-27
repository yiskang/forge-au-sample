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
  /////////////////////////////////////////////////////////////////
  // Generates random guid to use as DOM id
  //
  /////////////////////////////////////////////////////////////////
  function guid() {
    
    var d = new Date().getTime();
    
    var guid = 'xxxx-xxxx-xxxx-xxxx'.replace(
      /[xy]/g,
      function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c == 'x' ? r : (r & 0x7 | 0x8)).toString(16);
      });
    
    return guid;
  }

  class AdnModelStructurePanel extends Autodesk.Viewing.UI.DockingPanel {
    constructor( viewer, title, options ) {
      options = options || {};

      //  Height adjustment for scroll container, offset to height of the title bar and footer by default.
      if( !options.heightAdjustment )
        options.heightAdjustment = 70;

      if( !options.marginTop )
        options.marginTop = 0;

      super( viewer.container, viewer.container.id + 'AdnModelStructurePanel', title, options );

      this.container.classList.add( 'adn-docking-panel' );
      this.container.classList.add( 'adn-model-structure-panel' );
      this.createScrollContainer( options );

      this.viewer = viewer;
      this.options = options;
      this.uiCreated = false;

      this.addVisibilityListener(( show ) => {
        if( !show ) return;

        if( !this.uiCreated )
          this.createUI();

        this.resizeToContent();
      });
    }

    hasPropertyTask( model, dbId, propName, matches ) {
      return new Promise(function( resolve, reject ) {
        const instanceTree = model.getData().instanceTree;

        model.getProperties( dbId, function( result ) {
          const nodeName = instanceTree.getNodeName( dbId );
          const hasChildren = instanceTree.getChildCount( dbId ) > 0 ;

          if( !result.properties || hasChildren )
            return resolve();

          for( let i = 0; i < result.properties.length; ++i ) {
            const prop = result.properties[i];
  
            //check if we have a match
            if( !prop.displayName.contains( propName ) || !prop.displayValue )
              continue;

            let match = matches.find( node => node.text == prop.displayValue );
                
            if( !match ) {
              match = {
                id: 'mat-' + guid(),
                text: prop.displayValue,
                children: [
                  {
                    id: dbId,
                    text: nodeName
                  }
                ]
              };

              matches.push( match );
            } else {
              match.children.push({
                id: dbId,
                text: nodeName
              });
            }
          }

          return resolve();
        }, function() {
          return reject();
        });
      });
    }

    executeTaskOnModelTree( model, task ) {
      const taskResults = [];

      function _executeTaskOnModelTreeRec( dbId ){
        instanceTree.enumNodeChildren( dbId,
          function( childId ) {
            taskResults.push( task( model, childId) );
            _executeTaskOnModelTreeRec( childId );
          });
      }
  
      //get model instance tree and root component
      const instanceTree = model.getData().instanceTree;
      const rootId = instanceTree.getRootId();
  
      _executeTaskOnModelTreeRec( rootId );
  
      return taskResults;
    }

    buildTree() {
      const viewer = this.viewer;

      viewer.getObjectTree( () => {
        const matches = [];

        // Creates a thunk for our task
        // We look for all components which have a
        // property named 'Material' and returns a list
        // of matches containing dbId and the prop value
        const taskThunk = ( model, dbId ) => {
          return this.hasPropertyTask(
            model, dbId, 'Material', matches);
        };

        const taskResults = this.executeTaskOnModelTree(
          viewer.model,
          taskThunk
        );

        Promise.all( taskResults )
          .then(() => {
            console.log( 'Found ' + matches.length + ' matches' );
            console.log( matches );

            $( this.treeContainer )
              .on('select_node.jstree', function( e, data ) {
                console.log( e, data );
                if( !data ) return;
                
                let dbIds = [];
                viewer.clearSelection();

                if( data.node.id.contains( 'mat-' ) ) {
                  dbIds = data.node.children.map( child => parseInt( child ) );
                  
                } else {
                  const dbId = parseInt( data.node.id );
                  dbIds = [dbId];
                }

                viewer.select( dbIds );
                viewer.fitToView( dbIds );
              })
              // .on( 'open_node.jstree', ( e, data ) => {
              //   this.resizeToContent();
              // })
              // .on( 'close_node.jstree', ( e, data ) => {
              //   this.resizeToContent();
              // })
              .jstree({
                core: {
                  data: matches,
                  themes: {
                    icons: false
                  }
                }
              });
          });
      },
      function( code, msg ) {
        console.error( code, msg );
      });
    }

    createUI() {
      this.uiCreated = true;

      const div = document.createElement( 'div' );

      const treeDiv = document.createElement( 'div' );
      div.appendChild( treeDiv );
      this.treeContainer = treeDiv;

      this.scrollContainer.appendChild( div );

      this.buildTree();
    }
  }

  class AdnModelStructurePanelExtension extends Autodesk.Viewing.Extension {
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

      const modelStructurePanel = new AdnModelStructurePanel( viewer, 'Material Browser' );

      viewer.addPanel( modelStructurePanel );
      this.panel = modelStructurePanel;

      const structureButton = new Autodesk.Viewing.UI.Button( 'toolbar-adnModelStructureTool' );
      structureButton.setToolTip( 'ADN Model browser' );
      structureButton.setIcon( 'adsk-icon-structure' );
      structureButton.onClick = function() {
        modelStructurePanel.setVisible( !modelStructurePanel.isVisible() );
      };

      const subToolbar = new Autodesk.Viewing.UI.ControlGroup( 'toolbar-adn-tools' );
      subToolbar.addControl( structureButton );
      subToolbar.adnstructurebutton = structureButton;
      this.subToolbar = subToolbar;

      viewer.toolbar.addControl( this.subToolbar );

      modelStructurePanel.addVisibilityListener(function( visible ) {
        if( visible )
          viewer.onPanelVisible( modelStructurePanel, viewer );

        structureButton.setState( visible ? Autodesk.Viewing.UI.Button.State.ACTIVE : Autodesk.Viewing.UI.Button.State.INACTIVE );
      });
    }

    load() {
      if( this.viewer.toolbar ) {
        // Toolbar is already available, create the UI
        this.createUI();
      } else {
        // Toolbar hasn't been created yet, wait until we get notification of its creation
        this.viewer.addEventListener(
          Autoesek.Viewing.TOOLBAR_CREATED_EVENT,
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

  Autodesk.Viewing.theExtensionManager.registerExtension( 'Autodesk.ADN.ModelStructurePanel', AdnModelStructurePanelExtension );
})();