const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const bcrypt = require("bcrypt");

app.use(express.json());

app.post("/register_user", async (req, res) => {
  if (
    !req.body.name ||
    !req.body.password ||
    !req.body.age ||
    !req.body.gender ||
    !req.body.faculty
  ) {
    return res
      .status(400)
      .send("name,password,gender and faculty fields are required");
  }
  let user = await client
    .db("Restful_API")
    .collection("user")
    .findOne({ name: req.body.name });
  if (user) {
    return res.status(400).send("User already exists");
  }
  const hash = bcrypt.hashSync(req.body.password, 10);
  let result = await client.db("Restful_API").collection("user").insertOne({
    name: req.body.name,
    password: hash,
    age: req.body.age,
    gender: req.body.gender,
    faculty: req.body.faculty,
  });
  if (result.insertedCount === 0) {
    res.status(404).send("Insert failed");
  } else {
    res.send(result);
  }
});

app.get("/get_profile/:_id", async (req, res) => {
  let result = await client
    .db("Restful_API")
    .collection("user")
    .aggregate([
      {
        $match: {
          _id: new ObjectId(req.params._id),
        },
      },
      {
        $project: {
          _id: 0,
          name: 1,
          age: 1,
          gender: 1,
          faculty: 1,
        },
      },
    ])
    .toArray();
  if (result.length === 0) {
    res.status(404).send("User not found");
  } else {
    res.send(result);
  }
});

app.patch("/update_profile/:object_id", async (req, res) => {
  if (
    !req.body.name ||
    !req.body.password ||
    !req.body.age ||
    !req.body.gender ||
    !req.body.faculty
  ) {
    return res
      .status(400)
      .send("name,password,gender and faculty fields are required.");
  }
  let result = await client
    .db("Restful_API")
    .collection("user")
    .updateOne(
      { _id: new ObjectId(req.params.object_id) },
      {
        $set: {
          name: req.body.name,
          password: req.body.password,
          age: req.body.age,
          gender: req.body.gender,
          faculty: req.body.faculty,
        },
      }
    );
  if (result.modifiedCount === 0) {
    res.status(404).send("Update failed");
  } else {
    res.send(`Update sucessfully.\n`, result);
  }
});

app.delete("/delete/:object_id", async (req, res) => {
  let deleteData = await client
    .db("Restful_API")
    .collection("user")
    .deleteOne({
      _id: new ObjectId(req.params.object_id),
    });
  if (deleteData.deletedCount === 0) {
    return res.status(404).send("Delete failed");
  } else {
    res.send(`user has been deleted`);
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

//Path:package.json
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri =
  "mongodb+srv://b022210249:Asdfghjkl2326@cluster0.qexjojg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
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
