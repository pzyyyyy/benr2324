const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.post("/register_book", async (req, res) => {
  if (
    !req.body.title ||
    !req.body.author ||
    !req.body.year ||
    !req.body.genre ||
    !req.body.isbn
  ) {
    return res
      .status(400)
      .send("title, author, year, genre, and isbn fields are required");
  }
  let book = await client
    .db("Library")
    .collection("books")
    .findOne({ isbn: req.body.isbn });
  if (book) {
    return res.status(400).send("Book already exists");
  }
  let result = await client.db("Library").collection("books").insertOne({
    title: req.body.title,
    author: req.body.author,
    year: req.body.year,
    genre: req.body.genre,
    isbn: req.body.isbn,
  });
  if (result.insertedCount === 0) {
    res.status(404).send("Insert failed");
  } else {
    res.send(result);
  }
});

app.get("/get_book/:isbn", async (req, res) => {
  let result = await client
    .db("Library")
    .collection("books")
    .aggregate([
      {
        $match: {
          isbn: req.params.isbn,
        },
      },
      {
        $project: {
          _id: 0,
          title: 1,
          author: 1,
          year: 1,
          genre: 1,
        },
      },
    ])
    .toArray();
  if (result.length === 0) {
    res.status(404).send("Book not found");
  } else {
    res.send(result);
  }
});

app.patch("/update_book/:isbn", async (req, res) => {
  if (
    !req.body.title ||
    !req.body.author ||
    !req.body.year ||
    !req.body.genre
  ) {
    return res
      .status(400)
      .send("title, author, year, and genre fields are required.");
  }
  let result = await client
    .db("Library")
    .collection("books")
    .updateOne(
      { isbn: req.params.isbn },
      {
        $set: {
          title: req.body.title,
          author: req.body.author,
          year: req.body.year,
          genre: req.body.genre,
        },
      }
    );
  if (result.modifiedCount === 0) {
    res.status(404).send("Update failed");
  } else {
    res.send(`Update successfully.\n`, result);
  }
});

app.delete("/delete/:isbn", async (req, res) => {
  let deleteData = await client.db("Library").collection("books").deleteOne({
    isbn: req.params.isbn,
  });
  if (deleteData.deletedCount === 0) {
    return res.status(404).send("Delete failed");
  } else {
    res.send(`Book has been deleted`);
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri =
  "mongodb+srv://b022210249:Asdfghjkl2326@cluster0.qexjojg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
  } finally {
  }
}
run().catch(console.dir);
