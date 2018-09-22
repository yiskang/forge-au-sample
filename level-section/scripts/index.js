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
  const options = {
    env: 'Local',
  };

  const doc = { 'rootFolder': 'models/House', 'path': 'Resource/3D_View/_3D_ 960621/_3D_.svf', 'name': '3D view' };

  const config3d = {
    extensions: [ 'Autodesk.ADN.LevelSectionPanel' ]
  };
  const viewerDiv = document.getElementById( 'MyViewerDiv' );
  const viewer = new Autodesk.Viewing.Private.GuiViewer3D( viewerDiv, config3d );

  Autodesk.Viewing.Initializer(options, function() {
    if( viewer.start() != 0 ) return console.error( 'Failed to initialize viewer' );

    const basePath = getCurrentBaseURL();
    const modelFolderPath = basePath + doc.rootFolder + '/';
    const modelFilePath = modelFolderPath + doc.path;
    const modelOptions = {
      sharedPropertyDbPath: modelFolderPath,
      isAEC: true
    };

    viewer.addEventListener(
      Autodesk.Viewing.PROGRESS_UPDATE_EVENT,
      function( event ) {
        if(event.state == Autodesk.Viewing.ProgressState.LOADING)
          console.log( '%cPROGRESS_UPDATE_EVENT:', 'color: blue;', event );
      });

    viewer.addEventListener(
      Autodesk.Viewing.OBJECT_TREE_CREATED_EVENT,
      function() {
        console.log( '%cOBJECT_TREE_CREATED_EVENT: !!!Object tree loaded!!!', 'color: blue;' );
      });

    viewer.addEventListener(
      Autodesk.Viewing.GEOMETRY_LOADED_EVENT,
      function( event ) {
        console.log( '%cGEOMETRY_LOADED_EVENT: !!!Geometries loaded!!!', 'color: green;' );
        console.log( event );
      });

    // viewer.prefs.tag( 'ignore-producer' );
    // viewer.prefs.set( 'viewCube', true );

    viewer.loadModel( modelFilePath, modelOptions, onLoadModelSuccess, onLoadModelError );
  });

  function getCurrentBaseURL() {
    let basePath = '';
    const lastSlash = document.location.href.lastIndexOf( '/' );

    if( lastSlash != -1 )
      basePath = document.location.href.substr( 0, lastSlash + 1 );
    else
      basePath = document.location.href;

    return basePath;
  }

  /**
  * viewer.loadModel() success callback.
  * Invoked after the model's SVF has been initially loaded.
  * It may trigger before any geometry has been downloaded and displayed on-screen.
  */
  function onLoadModelSuccess(model) {
    console.log( 'onLoadModelSuccess()!' );
    console.log( 'Validate model loaded: ' + (viewer.model === model) );
    console.log( model );
  }

  /**
  * viewer.loadModel() failure callback.
  * Invoked when there's an error fetching the SVF file.
  */
  function onLoadModelError(viewerErrorCode) {
    console.error( 'onLoadModelError() - errorCode:' + viewerErrorCode );
  }
})();