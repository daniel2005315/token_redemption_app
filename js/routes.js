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

let csv = require('csv-express');

const fileUpload = require('express-fileupload');
app.use(fileUpload());

module.exports=app;

// Use a separate router for ajax request
app.use('/ajax', require('./ajaxRoutes.js'));

// Middleware to check if user has logged in
// By adding a "user" parameter too all template's local object
app.use(async function(req, res, next) {
  if(req.session.user!=null){
    // Store user info inside session
    try{
      console.log("calling middleware!!!! "+typeof req.next);
      let userData = await model.getInfo(req.session.user);
      console.log("User data returned = "+userData);
      req.session.userData = userData;
      res.locals.userData=req.session.userData;
    }catch(err){
      console.log(err.name);
    }
  }
  res.locals.user = req.session.user;
  next();

});

// Serve login page view
app.get('/login*', (req, res) => {
   res.render('login.ejs', { title: 'Login Page' });
});

//
app.post('/login', urlencodedParser, async (req, res) => {
  if(req.body.uname == "admin" && req.body.pword == "admin"){
      res.redirect('/be_listitem');
  }
  try{
    var authen = await model.authenticate(req.body.uname, req.body.pword);
    if (authen === true) {
      // req.session.regenerate() is asynchronous but it does not return a promise.
      // In order to use await, the function call is then wrapped in a Promise object
      await new Promise((resolve, reject)=> {
        req.session.regenerate(resolve);      // Recreate the session
      });

      // TODO: Add handling to check if the user is normal user or admin user
      req.session.user = req.body.uname;  // To represent successful login

      // Get user's info (balance, items)
      // TODO: may include admin flag here and redirect user's login
      let userData = await model.getInfo(req.session.user);
      req.session.userData = userData;
      console.log(userData);
      // Direct users to item list
      res.redirect('/listItems');

      }else{
      req.session.destroy(()=>{});  // Safe asyncrhous call
      res.render('login.ejs',
        { title: 'Login Page',
          loginMsg: 'Incorrect username or password! Please try again.',
          username: req.body.uname
        }
      );
    }
  }catch(err){ console.log(err);}

});

app.get('/logout', (req, res) => {
  req.session.destroy(()=>{});   // Safe asyncrhonus call
  res.redirect('/login');
});


app.get('/', (req, res) => {
   res.render('index.ejs', { title: 'Main'});
});

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
    console.log("**************"+order);
    res.render('listItems.ejs', { title: 'Item Listing', pageData: pageData, Query: Query, order:order, orderBy:orderBy });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error!');
  }
});

// query for showing item detailed view
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
  let data = await model.getInfo(req.session.user);
  res.render('myitem.ejs',{ title: 'My Item', data: data});

});

app.get('/be_listitem', async (req, res) => {
  try {
    let data = await model.getAllItems();
    //console.log(data);
    // Step 5: Render the view
    res.render('./backend/be_itemlist.ejs', { title: 'Item Listing', data: data,Query: Query});
  } catch (err) {
    console.error(err);
    res.status(500).send('Error!');
  }
});

app.get('/be_item', async (req, res) => {
  try {
    let itemId = req.query.id;
    if(itemId != "null"){
      //console.log(itemId);
      let data = await model.getItem(itemId);
      // Data can be null if not found
      res.render('./backend/be_itemdetail.ejs', { title: 'Item', data: data, Query: Query });
    }else{
      let data = "";
      res.render('./backend/be_itemdetail.ejs',{title: 'Item',data : data});
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Error!');
  }

});

app.post('/update_item', urlencodedParser ,async(req, res)=>{
  try {
      let id = req.body._id;
      let title = req.body.title;
      let quantity = req.body.quantity;
      let token_value = req.body.token_value;
      let description = req.body.description;
      let tags = req.body.tags;
      let image;

//<<<<<<< HEAD
//      console.log(req.body.image);
//=======
//>>>>>>> origin/master
      if (req.files.image == undefined){
          image = req.body.default_image;
        }else{
          // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
          let sampleFile = req.files.image;
          image = sampleFile.name;
          // Use the mv() method to place the file somewhere on your server
          sampleFile.mv('./public/'+sampleFile.name, function(err) {
            if (err)
              return res.status(500).send(err);
          });

        }
      if(id==""){
        let result = await model.addItem(title,description,image,token_value,quantity,tags);
        console.log("Added");
      }else{
        let result = await model.updateItem(id,title,description,image,token_value,quantity,tags);
        console.log("Updated");
        //res.send("Not yet implemented.");  // Place holder
    }
    res.redirect('/be_listitem');
  }catch (err){
    console.error(err);
    res.status(500).send('Error!');
  }
});

app.get('/remove_item' ,async(req, res)=>{
  try {
      let id = req.query.id;
      let result = await model.Item.remove({ _id: id }, function(err) {
        if(err){
           console.log(err);
           res.sendStatus(500);
         }
      });
      res.redirect('/be_listitem');
     }catch (err){
    console.error(err);
    res.status(500).send('Error!');
  }
});

app.get('/itemExportCSV' ,function(req, res){

    var filename   = "redeem.csv";

    var dataArray;

    model.Record.find({itemId:req.query.id},"username title token_value createdOn").lean().exec({}, function(err, item) {

        if (err) res.send(err);

        res.statusCode = 200;

        res.setHeader('Content-Type', 'text/csv');

        res.setHeader("Content-Disposition", 'attachment; filename='+filename);

        res.csv(item, true);

    });
    //res.redirect('/be_listitem');
});

app.get('/ExportCSV' ,function(req, res){

    var filename   = "All_redeem.csv";

    var dataArray;

    model.Record.find({},"username title token_value createdOn").lean().exec({}, function(err, item) {

        if (err) res.send(err);

        res.statusCode = 200;

        res.setHeader('Content-Type', 'text/csv');

        res.setHeader("Content-Disposition", 'attachment; filename='+filename);

        res.csv(item, true);

    });
    //res.redirect('/be_listitem');
});






// CSS files, images, client-side JS files should be in ./public
app.use(express.static('public'));
