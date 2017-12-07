'use strict';

let bodyParser = require('body-parser');
let urlencodedParser = bodyParser.urlencoded({extended:false});
let jsonParser = bodyParser.json({});

let router = require('express').Router();

let model = require('./model.js');

module.exports = router;

router.get('/items', async (req, res) => {
  // Step 1: Retrieve input data from the request
   let page = req.query.page-0;       // Convert to number
   let orderBy = req.query.orderBy-0; // Convert to number
   let order = req.query.order-0;     // Convert to number

  // Step 2 (TODO): Validate input and check if the user
  // has the right to proceed.

  // Step 3: Apply "business logic", and
  // Step 4: Prepare the data needed by the view (client-side)
   let items = await model.getItems(page, orderBy, order);
   res.json(items);
});
