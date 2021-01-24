/**
 * This app doesn't do much but is used for demo/example purposes.
 * It serves the contexts of the build/ dir 
 * and the build/index.html file for the root path /
 */

const express = require( `express` )

const app = express()

app.use( express.static( `build` ) )

app.get( `/`, ( req, res ) => res.sendFile( `build/index.html` ) )

app.listen( parseInt( process.argv[ 2 ] ) )