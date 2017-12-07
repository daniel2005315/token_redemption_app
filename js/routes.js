'use strict';
// This file contains the routing rules for the app

let express = require('express');
let bodyParser = require('body-parser');
let urlencodedParser = bodyParser.urlencoded({extended:false});
let jsonParser = bodyParser.json({});

// For constructing query string from object properties
const Query = require('query-string');

// For convenience, just name the router 'app'
let app = require('express').Router();

let model = require('./model.js');

module.exports=app;

// Use a separate router for ajax request
app.use('/ajax', require('./ajaxRoutes.js'));

// Middleware to check if user has logged in
// By adding a "user" parameter too all template's local object
app.use(function(req, res, next) {
  res.locals.user = req.session.user;
  next();
});

// Serve login page view
app.get('/login', (req, res) => {
   res.render('login.ejs', { title: 'Login Page' });
});

//
app.post('/login', urlencodedParser, async (req, res) => {
  if (model.authenticate(req.body.uname, req.body.pword) === true) {
    // req.session.regenerate() is asynchronous but it does not return a promise.
    // In order to use await, the function call is then wrapped in a Promise object
    await new Promise((resolve, reject)=> {
      req.session.regenerate(resolve);      // Recreate the session
    });

    // TODO: Add handling to check if the user is normal user or admin user
    req.session.user = req.body.uname;  // To represent successful login
    // Direct users to item list
    res.redirect('/listItems');
  }
  else {
    req.session.destroy(()=>{});  // Safe asyncrhous call
    res.render('login.ejs',
      { title: 'Login Page',
        loginMsg: 'Incorrect username or password! Please try again.',
        username: req.body.uname
      }
    );
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy(()=>{});   // Safe asyncrhonus call
  res.redirect('/login');
});


app.get('/', (req, res) => {
   res.render('index.ejs', { title: 'Main'});
});

/* Not employing Approach #1
// Approach #1
app.get('/listItems', (req, res) => {
  // Simply return the HTMl page.
  // Use client-side JS to retrieve data and render page
  res.render('listItems.ejs', { title: 'Item Listing' });
});
*/

// Listing out all the items
// We use Approach #2: Render the page on server side
app.get('/listItems', async (req, res) => {
  try {
    // Step 1: Retrieve input data from the request
    let page = req.query.page-0;       // Convert to number
    let orderBy = req.query.orderBy-0; // Convert to number
    let order = req.query.order-0;     // Convert to number

    // Step 2 (TODO): Validate input and check if the user
    // has the right to proceed.

    // Step 3: Apply "business logic", and
    // Step 4: Prepare the data needed by the view
    let pageData = await model.getItems(page, orderBy, order);
    console.log(pageData);
    console.log(Query);
    // Step 5: Render the view
    res.render('listItems2.ejs', { title: 'Item Listing', pageData: pageData, Query: Query });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error!');
  }
});

app.get('/item', async (req, res) => {

  try {
    let itemId = req.query.id;
    let data = await model.getItem(itemId);
    // Data can be null if not found
    res.render('item.ejs', { title: 'Item', data: data, Query: Query });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error!');
  }

});

app.get('/myitem', async (req, res)=>{
  // TODO: Get the items where the user has redeemed
  let data = "To be implemented";
  res.render('myitem.ejs',{ title: 'My Item', data: data});

})

// CSS files, images, client-side JS files should be in ./public
app.use(express.static('public'));