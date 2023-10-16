//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

let List;

main().catch(err => console.log(err));

async function main() {
  try {
    await mongoose.connect('mongodb+srv://mirajdoshi:miraj123@cluster0.ej2map5.mongodb.net/todolistDB');

    const itemsSchema = {
      name: String
    };

    const listSchema = new mongoose.Schema({
      name: String,
      items: [itemsSchema]
    });

    const Item = mongoose.model("Item", itemsSchema);

    List = mongoose.model("List", listSchema);

    const item1 = new Item({
      name: "Welcome to your To-Do List"
    });

    const item2 = new Item({
      name: "Hit the + button to add a new item"
    });

    const item3 = new Item({
      name: "<--- Hit this to delete an item"
    });

    const defaultItems = [item1, item2, item3];
    const workItems = [];

    app.get("/", async function (req, res) {

      const foundItems = await Item.find();

      if(foundItems.length === 0){
        await Item.insertMany(defaultItems);
        res.redirect('/');
      }
      else{
        res.render("list", { listTitle: "Today", newListItems: foundItems });
      }

    });

    app.get("/:customListName", async function (req, res) {
      const customListName = _.capitalize(req.params.customListName);

      try {
        const foundList = await List.findOne({ name: customListName }).exec();

        if (!foundList) {
          const list = new List({ 
            name: customListName, 
            items: defaultItems 
          });

          await list.save();
          res.redirect("/" + customListName);
        } 
        else{
          res.render("list", { listTitle: customListName, newListItems: foundList.items });
        }

      } catch (err) {
        console.error('Error:', err);
      }
    });

    app.post("/", async function (req, res) {

      const itemName = req.body.newItem;
      const listName = req.body.list;

      const item = new Item({
        name: itemName
      });

      if(listName === "Today"){
        item.save();
        res.redirect("/");
      }
      else{
        const currentList = await List.findOne({name: listName}).exec();

        if(currentList != null){
          currentList.items.push(item);
          currentList.save();
          res.redirect("/" + listName);
        }
      }
    });

    app.post("/delete", async function(req,res){
      
        try{
          const checkedItemId = req.body.checkbox;
          const listName = req.body.listName;

          if(listName === "Today"){
            await Item.findByIdAndRemove(checkedItemId);
            res.redirect("/");
          }
          else{
            await List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, {
              new: true
            });
            res.redirect("/" + listName);
          }
        }
        catch(err){
          console.log("error reomving item: ", err);
        }
    });

    app.get("/about", function (req, res) {
      res.render("about");
    });

    app.listen(3000, function () {
      console.log("Server started on port 3000");
    });

  } catch (err) {
    console.error('Error connecting to MongoDB:', err);
  }
}
