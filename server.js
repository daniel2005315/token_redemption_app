'use strict';

let express = require('express');
let session = require('express-session');
let app = express();

require('./js/db.js');        // Set up DB

app.use( session({
    secret: 'mysecretkey',
    resave: false,            // save session only if session data have been
                              // modified
    saveUninitialized: false  // save session if it is not empty
                              // after it is first created
}));

app.set('view engine', 'ejs'); // set up ejs for templating

// Setup the routing rules in ./js/routes
app.use(require('./js/routes.js'));

app.listen(8081);

console.log("\n***Server is now running on port 8081***\n");
