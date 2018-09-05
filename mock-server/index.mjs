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

import jsonServer from 'json-server';
import path from 'path';
import { DIRNAME } from './expose';
import routes from './routes.json';

const servePort = 3000;
const dbFile = path.join( DIRNAME, 'db.json' );

const server = jsonServer.create();
const foreignKeySuffix = '_id';
const router = jsonServer.router( dbFile , { foreignKeySuffix } );

const defaultsOpts = {
  static: path.join( process.cwd(), './' ),
  bodyParser: true
};
const middlewares = jsonServer.defaults( defaultsOpts );
const rewriter = jsonServer.rewriter( routes );

server.use( middlewares );
server.use( rewriter );
server.use( router );
server.listen( servePort, () => {
  console.log( 'JSON server runing on port %d', servePort );
});