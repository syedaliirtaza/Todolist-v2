
const express = require("express"); // required installed packages
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

//mongodb connection
//create a new database

mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser: true});

//creating a new Schema

const itemsSchema = new mongoose.Schema ({
  name: String
});

// creating a new model

const Item = mongoose.model("Item", itemsSchema);

// creating a new document
const item1 = new Item({
  name: "Welcome to your todolist"
});

const item2 = new Item({
  name: "Hit the + button to add a new item"
});

const item3 = new Item({
  name: "<-- Hit this to delete an item"
});

const defaultItems = [item1, item2, item3];


// new schema for custom routes
const listSchema = {
  name: String,
  items: [itemsSchema]
};

// now create a new model for custom routes
const List = mongoose.model("List", listSchema);


// tells our app to use EJS as its view engine. Always after declaring "app".
app.set("view engine", "ejs"); 


app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

// for express to serve up the public folder as a static resource
app.use(express.static("public")); 

app.get("/", function (req, res) {
  

  // read items from db
  Item.find({}, function(err, foundItems){
    
    if(foundItems.length === 0){
          // insert items once into item collection
          Item.insertMany(defaultItems, function(err){
            if(err){
              console.log(err);
            } else {
              console.log("succesfully saved default items to DB")
            }
          });
          res.redirect("/");
        } else {
          res.render("list", {listTitle: "Today", newListItems: foundItems});
        }
    });
});

app.post("/", function (req, res) {
  // receives the post request from the html form

  const itemName = req.body.newItem;
  const listName = req.body.list; 

  const item = new Item({
    name: itemName
  });

  if(listName === "Today"){

  item.save();

  res.redirect("/");

  } else {
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();

      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function(req, res){
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    //checking which list we are making post req to
    if(listName === "Today"){
      Item.findByIdAndRemove(checkedItemId, function(err){
        if(!err){
          console.log("deleted the checked item");
          res.redirect("/");
        }
      });
    } else {
      //this means post req is from custom lists so we have to go into existing items array and find that item and delete it
      // List.findOneAndUpdate({condition}, {what updates}, callback)
      // The $pull operator removes from an existing array all instances of a value or values that match a specified condition.

      List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
        if (!err){
          res.redirect("/" + listName);
        }
      });
    }

});

app.get("/:customListName", function(req,res){
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, function(err, foundList){
    if (!err){
      if (!foundList){
        //Create new list

          // new document
        const list = new List({
          name: customListName,
          items: defaultItems
        });

        list.save();
        res.redirect("/" + customListName);
      } else {
        //show an existing list

        res.render("list", {listTitle: foundList.name, newListItems: foundList.items})
      }
    } else {
      console.log(err);
    }
  });
});

app.get("/about", function (req, res) {
  res.render("about");
});


app.listen(5000, function () {
  console.log("Server is running on port 5000");
});