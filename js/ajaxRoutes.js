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

// TODO: Ajax handler for redeeming item and update database
router.get('/redeem',async(req,res)=>{
  console.log("** Ajax call for redeeming item received!");
  let itemid = req.query.id;
  // get the item info for checking quantity and value
  let itemdata = await model.getItem(itemid);
  console.log("Item data =\n"+itemdata);
  let userdata = req.session.userData;
  console.log("user data=\n"+userdata);

  // Reject
  if(userdata==null){
    console.log("Unauthorized user!");
    res.send({loginAlert:true});
    //res.send(404);
  }else{
    // check if the user is valid for redeeming the item
    if(itemdata.quantity==0||userdata.balance<itemdata.token_value){
      console.log("Cannot redeem");
      // TODO: improve the interface and flow
      res.send({update:false});
    }else{
      console.log("Can redeem, user =>"+req.session.user+" is redeeming "+itemid);
      // Try to update database
      try{
        let result = await model.redeemItem(itemid,req.session.user);
        console.log("data from ajaxroute:\n"+result);
        res.send({update:result});
      }catch(err){
        res.send({update:false});
      }
    }

  }
});
