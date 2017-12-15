'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
// add html type
require('mongoose-html').loadType(mongoose);
var Html = mongoose.Types.Html;
/*
username: username,
password: password,
balance: balance,
items: items
*/
var UserSchema = Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  balance:{type: Number, min:0},
  items:{type:Array, default:[]}
});

/*
  id: id,
  title: title,
  description: description,
  image: image,
  token_value: token_value,
  quantity: quantity,
  createdOn: createdOn,
  tags: tags
*/
var ItemSchema = Schema({
  id: { type: String, required:true, unique:true },
  title: {type: String, required:true, unique:true},
  description: { type: Html,
    setting: {
      allowedTags: ['p', 'b', 'i', 'u', 'strong', 'pre', 'br']
    }
  },
  image:{type: String, default: ''},
  token_value:{type: Number, min: 1},
  quantity:{type:Number, min:0},
  createdOn: { type: Date, default: Date.now },
  tags: [ { type: String } ]
});

// store redeem record
var RecordSchema = Schema({
  username: { type: String, required: true},
  itemId: { type: String, required: true },
  title:{type:String, required: true},
  token_value:{type: Number},
  createdOn: { type: Date, default: Date.now }
});

var User = mongoose.model('User', UserSchema);
var Item = mongoose.model('Item', ItemSchema);
var Record = mongoose.model('Record', RecordSchema);

var id_count = 20;

class PaginationData {
  constructor (props) {
    if (props === undefined)
      return;

    for (let key in props) {
      this[key] = props[key];
    }
  }

  validate() { // Ensure all required properties have a value.
    let requiredProperties =
      [ 'pageCount', 'pageSize', 'currentPage', 'items', 'params' ];
    for (let p of requiredProperties) {
      if (this[p] === undefined) {
        console.error(this, `Property '${p}' is undefined.`);
      }
    }
  }
}

// Place holder. The parameter orderBy is not used in this example.
async function getItems(page, orderBy, order) {

  // Determine the sorting order
  // In this example, orderBy == 1 => order by 'createdOn'
  orderBy = orderBy || 1;   // Default to 1
  order = (order == 1 || order == -1) ? order : 1;

  let pData = new PaginationData( {
     pageSize: 10,
     params: {
       orderBy: orderBy,
       order: order
     }
  });

  let condition = {};   // Retrieve all items

  let itemCount = await Item.count(condition);

  pData.pageCount = Math.ceil(itemCount / pData.pageSize);

  // Ensure the current page number is between 1 and pData.pageCount
  page = (!page || page <= 0) ? 1 : page;
  page = (page >= pData.pageCount) ? pData.pageCount : page;
  pData.currentPage = page;

  // Construct parameter for sorting
  let sortParam = {};
  if (orderBy == 1)
    sortParam = { createdOn: order };
  // TODO: added sort by redeem cost
  if (orderBy == 2)
    sortParam = { token_value: order};

  // ----- Construct query and retrieve items from DB -----
  // Construct query

  pData.items = await Item.
    find(condition).
    skip(pData.pageSize * (pData.currentPage-1)).
    limit(pData.pageSize).
    sort(sortParam).
    exec();

  pData.validate(); // Make sure all required properties exist.

  return pData;
}


async function getItem(id) {
  try{
    let _id = new mongoose.Types.ObjectId(id);
    let result = await Item.
    findOne( {_id: _id}). // only return item's value and quantity
    exec();
    return result;
  }catch(err){
    console.log(err.name);
    return false;
  }
}

// update item quantity -1
// update user balance - item value
// insert item to record
async function redeemItem(id,user){
  console.log("Redeeming item with id "+id+" for user =>"+user);
  var updateFlag=false;
  // update the database first
  let _id = new mongoose.Types.ObjectId(id);

  // Decrease number of item in database first
  let item = await Item.findOne({_id, _id}).exec();
  //console.log(item);
  item.quantity=item.quantity-1;
  console.log("this line appears after item info");

  try{
    let operation = await item.save();
    console.log("***Decreased number of items!");
    let userUpdate = await User.findOneAndUpdate({username:user},{$inc:{balance:-item.token_value}}).exec();
    console.log("***Updated user's balance");
    //console.log("appending item =>"+item);
    //let userItemsUpdate = await User.findOneAndUpdate({username:user},{$push:{items:item}}).exec();
    //console.log("***Updated user's items");
    console.log("adding -> "+typeof user+" "+
              typeof _id.toString()+" "+typeof item.title+" "+typeof item.token_value);
    let recordUpdate = await addRecord(user,_id.toString(),item.title,item.token_value);
    console.log("***Added record entry "+recordUpdate);
    var entry = {
      itemId: recordUpdate.itemId,
      title: recordUpdate.title,
      token_value: recordUpdate.token_value,
      timeStamp: recordUpdate.createdOn
    };
    let updatedUser = await User.findOneAndUpdate({username:user},{$push:{items:entry}}).exec();
    console.log("***update items");
    return updatedUser;
  }catch(err){
    console.log(err.name);
    return false;
  }
}

// Get userInfo (everything)
async function getInfo(username){
  let result = await User.
    findOne({username:username},'balance items').  // only return balance and items
    exec();
  return result;
}

// Add record
async function addRecord(username,itemId,title,token_value){
  console.log("**** Function called");
  var record= new Record({
    username: username,
    itemId: itemId,
    title:title,
    token_value:token_value
  });
  console.log("**** record created");
  try{
    let result = await record.save();
    console.log(result);
    return result;
  }catch(err){
    console.log(err);
    return false;
  }
}

// Place holder for authentication
async function authenticate(username, password) {
  // TODO: authenticate with DB
  try{
  let authen = await User.findOne({username: username}).exec();
  console.log("Attempting to login as"+ username+" pw checking...");
    if(authen.password===password){
        console.log("login success!");
        return true;
    }else{
      return false;
    }
  }catch(err){
    console.log(err);
    return false;
  }
  //return (username === 'john' && password === '123');
}

async function getAllItems() {
  try{
    let condition = {}
    let result = await Item.
      find(condition). // only return item's value and quantity
      exec();
    return result;
    }catch(err){
    console.log(err);
    return false;
  }
}

async function addItem(title, description, image, token_value, quantity, tags){
//<<<<<<< HEAD
//  let last_id;
//  Item.findOne({}, {}, { sort: { 'id' :-1 } }, function(err, post) {
//    console.log(post.id);
//    last_id = post.id
//  });
//  last_id++;
//  var item= new Item({
//    id: last_id,
//=======
  var item= new Item({
    id: ++id_count,
//>>>>>>> origin/master
    title: title,
    description: description,
    image:image,
    token_value:token_value,
    quantity:quantity,
    tags:tags
  });

  try{
    let result = await item.save();
    console.log(result);
    return result;
  }catch(err){
    console.log(err);
    return false;
  }
}

async function updateItem(id, title, description, image, token_value, quantity, tags){
  try{
    let result = await Item.findOneAndUpdate({_id:id},{$set:{
      title: title,
      description: description,
      image:image,
      token_value:token_value,
      quantity:quantity,
      tags:tags
    }}).exec();
    console.log(result);
    return result;
  }catch(err){
    console.log(err);
    return false;
  }
}

module.exports = {
  User: User,
  Item: Item,
  Record: Record,
  authenticate: authenticate,
  getItems: getItems,
  getItem: getItem,
  getInfo: getInfo,
  redeemItem: redeemItem,
  getAllItems: getAllItems,
  updateItem:updateItem,
  addItem:addItem
}
