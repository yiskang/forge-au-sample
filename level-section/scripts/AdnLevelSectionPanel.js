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

  class AdnLevelSectionPanel extends Autodesk.Viewing.UI.DockingPanel {
    constructor( viewer, title, options ) {
      options = options || {};

      //  Height adjustment for scroll container, offset to height of the title bar and footer by default.
      if( !options.heightAdjustment )
        options.heightAdjustment = 70;

      if( !options.marginTop )
        options.marginTop = 0;

      super( viewer.container, viewer.container.id + 'AdnLevelSectionPanel', title, options );

      this.container.classList.add( 'adn-docking-panel' );
      this.container.classList.add( 'adn-lvl-section-panel' );
      this.createScrollContainer( options );

      this.viewer = viewer;
      this.options = options;
      this.uiCreated = false;

      this.addVisibilityListener(( show ) => {
        if( !show ) return;

        if( !this.uiCreated )
          this.createUI();
      });

      this.onButtonClicked = this.onButtonClicked.bind( this );
    }

    getRemoteLevels() {
      return new Promise(( resolve, reject ) => {
        const srvUrl = getServerUrl();
        fetch( `${ srvUrl }/api/levels`, {
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
            if( !data ) return reject( new Error( 'Failed to fetch levels from the server' ) );

            return resolve( data );
          })
          .catch( ( error ) => reject( new Error( error ) ) );
      });
    }

    createSelectOptions( data, selector ) {
      if( !data || !selector || !(selector instanceof HTMLSelectElement) )
        return;

      for( let i=0; i < data.length; ++i ) {
        const level = data[i];

        const option = document.createElement( 'option' );
        option.value = i;
        option.text = level.name;
        selector.add( option );
      }
    }

    async createUI() {
      this.uiCreated = true;

      const table = document.createElement( 'table' );
      table.className = 'adsk-lmv-tftable adn-lvl-section-panel-table';

      const tbody = document.createElement( 'tbody' );
      table.appendChild( tbody );
      this.scrollContainer.appendChild( table );

      const upperRow = tbody.insertRow( -1 );
      const upperTextCell = upperRow.insertCell( 0 );
      upperTextCell.innerText = 'Upper:';
      const upperSelectCell = upperRow.insertCell( 1 );

      const lowerRow = tbody.insertRow( -1 );
      const lowerTextCell = lowerRow.insertCell( 0 );
      lowerTextCell.innerText = 'Lower:';
      const lowerSelectCell = lowerRow.insertCell( 1 );

      const upperLvlSelector = document.createElement( 'select' );
      upperLvlSelector.id = 'adn-upper-lvl-selector';
      upperLvlSelector.className ='adn-lvl-selector';
      upperSelectCell.appendChild( upperLvlSelector );

      const lowerLvlSelector = document.createElement( 'select' );
      lowerLvlSelector.id = 'adn-lower-lvl-selector';
      lowerLvlSelector.className = 'adn-lvl-selector';
      lowerSelectCell.appendChild( lowerLvlSelector );

      const data = await this.getRemoteLevels();
      this.levels = data;

      this.createSelectOptions( data, upperLvlSelector );
      this.createSelectOptions( data, lowerLvlSelector );

      const buttonRow = tbody.insertRow( -1 );
      const buttonCell = buttonRow.insertCell( 0 );
      buttonCell.colSpan = 2;

      const sectionButton = document.createElement( 'button' );
      sectionButton.type = 'button';
      sectionButton.textContent = 'Apply';
      buttonCell.appendChild( sectionButton );

      sectionButton.addEventListener(
        'click',
        this.onButtonClicked
      );

      this.resizeToContent();
    }

    getCutPlaneParam( idx, n ) {
      if( idx < 0 || !n ) return;

      const level = this.levels[idx];
      if( !level ) return;

      //const precision = Autodesk.Viewing.Private.calculatePrecision( level.elevation  );
      const model = this.viewer.model;
      const globalOffset = model.getData().globalOffset;
      const units = model.getUnitString();
      const elevRaw = Autodesk.Viewing.Private.convertUnits( level.units, units, 1, level.elevation );

      let d = elevRaw - globalOffset.z;
      if( n == 1 )
        d = -1 * d;

      return new THREE.Vector4( 0, 0, n, d );
    }

    onButtonClicked() {
      const upperSelector = document.getElementById( 'adn-upper-lvl-selector' );
      const lowerSelector = document.getElementById( 'adn-lower-lvl-selector' );

      if( !upperSelector || !lowerSelector )
        return;

      const upperIdx = upperSelector.selectedIndex;
      const upperCutPlaneParam = this.getCutPlaneParam( upperIdx, 1 );
      const lowerIdx = lowerSelector.selectedIndex;
      const lowerCutPlaneParam = this.getCutPlaneParam( lowerIdx, -1 );

      this.viewer.setCutPlanes( [ upperCutPlaneParam, lowerCutPlaneParam ] );
    }
  }

  class AdnLevelSectionPanelExtension extends Autodesk.Viewing.Extension {
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

      const lvlSectionPanel = new AdnLevelSectionPanel( viewer, 'Level Section' );

      viewer.addPanel( lvlSectionPanel );
      this.panel = lvlSectionPanel;

      const lvlSectionButton = new Autodesk.Viewing.UI.Button( 'toolbar-adnLevelSectionsTool' );
      lvlSectionButton.setToolTip( 'Level Sections' );
      lvlSectionButton.setIcon( 'adsk-icon-properties' );
      lvlSectionButton.onClick = function() {
        lvlSectionPanel.setVisible( !lvlSectionPanel.isVisible() );
      };

      const subToolbar = new Autodesk.Viewing.UI.ControlGroup( 'toolbar-adn-tools' );
      subToolbar.addControl( lvlSectionButton );
      subToolbar.adnLvlsectionbutton = lvlSectionButton;
      this.subToolbar = subToolbar;

      viewer.toolbar.addControl( this.subToolbar );

      lvlSectionPanel.addVisibilityListener(function( visible ) {
        if( visible )
          viewer.onPanelVisible( lvlSectionPanel, viewer );

        lvlSectionButton.setState( visible ? Autodesk.Viewing.UI.Button.State.ACTIVE : Autodesk.Viewing.UI.Button.State.INACTIVE );
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

  Autodesk.Viewing.theExtensionManager.registerExtension( 'Autodesk.ADN.LevelSectionPanel', AdnLevelSectionPanelExtension );
})();