'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
//let ObjectId = Schema.Types.ObjectId;

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
  items:[ { type: String } ]
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
  description: { type: String, default: '' },
  // TODO: include image for each item?
  image:{type: String, default: ''},
  token_value:{type: Number, min: 1},
  quantity:{type:Number, min:0},
  createdOn: { type: Date, default: Date.now },
  tags: [ { type: String } ]
});

var User = mongoose.model('User', UserSchema);
var Item = mongoose.model('Item', ItemSchema);


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
  let _id = new mongoose.Types.ObjectId(id);
  let result = await Item.
    findOne( {_id: _id} ).
    populate('owner', 'username'). // only return the owner's username
    exec();
  return result;
}

// Get userInfo (everything)
async function getInfo(username){
  let result = await User.
    findOne({username:username},'balance items').  // only return balance and items
    exec();
  return result;
}

// Place holder for authentication
function authenticate(username, password) {
  return (username === 'john' && password === '123');
}

module.exports = {
  User: User,
  Item: Item,
  authenticate: authenticate,
  getItems: getItems,
  getItem: getItem,
  getInfo: getInfo
}
