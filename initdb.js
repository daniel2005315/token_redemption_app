// This file contains code to repopulate the DB with test data

var mongoose = require('mongoose');

require('./js/db.js'); // Set up connection and create DB if it does not exists yet

var model = require('./js/model.js');

// Remove existing data from Users and Items collections and
// repopulate them with test data
model.User.remove({}, function(err) {
  if (err)
    return console.log(err);

  model.Item.remove({}, function(err) {
    if (err)
      return console.log(err);

    // Populate data only after both collections are cleared.
    populateData();
  });
});

// ----------------------------------------------------------------------


function populateData() {
  var t = [ 'yummy', 'delicious', 'yuk', 'pretty', 'funny',
            'pricy', 'meh', 'interesting', 'omg', 'bravo' ];
  // each item contains the following attributes
  // id, title, description, image, token_value, quantity,createdTimeStamp, tags
  var items = [
    _item(0, 'Apple','A yummy food','no image',10, 99,  new Date(2016, 11, 10), [t[0], t[1], t[3], t[4]]),
    _item(1, 'Orange','A yummy food','no image',10, 99, new Date(2016, 10, 10), [t[3], t[5], t[8], t[4]]),
    _item(2, 'Strawberry','A yummy food','no image',10, 99, new Date(2016, 1, 12), [t[0], t[9], t[3], t[4]]),
    _item(3, 'Watermelon','A yummy food','no image',10, 99, new Date(2016, 3, 13), [t[0], t[1], t[6], t[4]]),
    _item(4, 'Pear','A yummy food','no image',10, 99, new Date(2016, 4, 30), [t[0], t[2], t[8], t[7]]),
    _item(5, 'Peach','A yummy food','no image',10, 99, new Date(2016, 2, 20), [t[1], t[1], t[3], t[4]]),
    _item(6, 'Pineapple','A yummy food','no image',10, 99, new Date(2016, 1, 15), [t[2], t[7], t[4], t[4]]),
    _item(7, 'Grape','A yummy food','no image',10, 99, new Date(2016, 1, 1), [t[0], t[9], t[8], t[3]]),
    _item(8, 'Banana','A yummy food','no image',10, 99, new Date(2016, 6, 20), [t[0], t[2], t[3], t[1]]),
    _item(9, 'Mango','A yummy food','no image',10, 99, new Date(2016, 3, 10), [t[7], t[1], t[3], t[2]]),
    _item(10, 'Plum','A yummy food','no image',10, 99, new Date(2016, 1, 20), [t[0], t[1], t[3], t[3]]),
    _item(11, 'Lychee','A yummy food','no image',10, 99, new Date(2016, 10, 10), [t[0], t[1], t[7], t[4]]),
    _item(12, 'Kiwi','A yummy food','no image',10, 99, new Date(2016, 9, 11), [t[9], t[4], t[8], t[2]]),
    _item(13, 'Fig','A yummy food','no image',10, 99, new Date(2016, 1, 12), [t[2], t[1], t[5], t[6]]),
    _item(14, 'Green Apple','A yummy food','no image',10, 99, new Date(2015, 11, 10), [t[0], t[2], t[4], t[7]]),
    _item(15, 'Apricot','A yummy food','no image',10, 99, new Date(2015, 2, 12), [t[8], t[0], t[2], t[3]])
  ];

  // 11 users
  // each user contains the following attributes
  // name, pw, balance
  var users = [
    _user('john', '123' ,100),
    _user('jane', '123' ,100),
    _user('eric', '123' ,100),
    _user('matt', '123' ,100),
    _user('jill', '123' ,100),
    _user('bill', '123' ,100),
    _user('bob',  '123' ,100),
    _user('charles','123' ,100),
    _user('susan', '123' ,100),
    _user('tanya','123' ,100),
    _user('fred','123' ,100)
  ];


  // Insert all users at once
  model.User.create(users, function(err, _users) {
    if (err) handleError(err);

    // _users are now saved to DB and have _id

    // Insert all items
    model.Item.create(items, function(err, _items) {
      if (err) handleError(err);

    /* Does not work
    // replace all item ids with their created index
    for (var i = 0; i < items.length; i++) {
      items[i].id = _items[i]._id;
    }
    */

      // Success
      console.log(_users);
      console.log(_items);
      mongoose.connection.close();
    });
  });
}

function _user(username,password,balance, items) {
  return {
    username: username,
    password: password,
    balance: balance,
    items: items
  };
}

function _item(id, title, description, image, token_value, quantity, createdOn, tags) {
  return {
    id: id,
    title: title,
    description: description,
    image: image,
    token_value: token_value,
    quantity: quantity,
    createdOn: createdOn,
    tags: tags
  };
}

function handleError(err) {
  console.log(err);
  mongoose.connection.close();
}
