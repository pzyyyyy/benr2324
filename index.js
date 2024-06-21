const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

app.use(express.json());

app.post("/register", verifyToken, (req, res) => {
  if (req.user.role == "admin") {
    const username = req.body.username;
    const password = req.body.password;
    user = db.collection("users").find({ username: username });
    if (user) {
      res.send("User already exists");
    } else {
      const hash = bcrypt.hashSync(password, 10);
      db.collection("users").insertOne({ username: username, password: hash });
      res.send("User created");
    }
  } else {
    res.send("Unauthorized");
  }
});

//new user registration
app.post("/reg", async (req, res) => {
  const hash = bcrypt.hashSync(req.body.password, 10);

  //insetOne
  let result = await client.db("BERR2243").collection("student").insertOne({
    username: req.body.username,
    password: hash,
    name: req.body.name,
    email: req.body.email,
  });
  res.send(result);
});

app.post("/login", async (req, res) => {
  //Step1: req body username exit
  if (req.body.username != null && req.body.password != null) {
    let result = await client.db("BERR2243").collection("student").findOne({
      username: req.body.username, //pwd alrdy hash
    });

    if (result) {
      //Step2: Check if password is correct
      if (bcrypt.compareSync(req.body.password, result.password) == true) {
        var token = jwt.sign(
          { _id: result._id, username: result.username, name: result.name },
          "Super secret passkey"
          // { expiresIn: 100 * 60 }
        );
        res.send(token);
        //res.send("Login success");
      } else {
        res.status(401).send("Wrong password");
      }
    } else {
      // step #3: if user not found
      res.status(401).send("username is not found");
    }
  } else {
    res.status(400).send("missing username or password");
    // console.log(result)
  }
});

//middleware
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) return res.sendStatus(401);
  jwt.verify(token, "Super secret passkey", (err, decoded) => {
    console.log(err);
    if (err) return res.sendStatus(403);
    req.identify = decoded;
    next();
  });
}

//get user profile with token
app.get("/getprofile/:id", verifyToken, async (req, res) => {
  console.log("YES");
  const token = req.headers.authorization.split(" ")[1];
  let decoded = jwt.verify(token, "Super secret passkey");

  if (decoded) {
    //if user is login
    if (req.identify._id != req.params.id) {
      //if user is accessing his own profile
      res.status(401).send("Unauthorized Access");
    } else {
      let result = await client.db("BERR2243").collection("student");
      // .findOne({
      //   _id: new ObjectId(req.params.id),
      // }); //find the user profile by using id
      res.send(result);
      console.log(req.params);
    }
  } else {
    res.status(401).send("Unauthorized");
  }
});
app.get("/user/:name", async (req, res) => {
  let result = await client.db("BERR2243").collection("student").findOne({
    name: req.params.name, //name:new ObjectId(req.params.name)
  });

  res.send(result);
});
//patch(update) user profile
app.patch("/user/:id", verifyToken, async (req, res) => {
  let result = await client
    .db("BERR2243")
    .collection("student")
    .updateOne(
      { _id: new ObjectId(req.params.name) },
      { $set: { name: req.body.name } }
    );
  res.send(result);
});

//delete user profile
app.delete("/user/:id", verifyToken, async (req, res) => {
  let result = await client.db("BERR2243").collection("student").deleteOne();
  res.send(result);
});

app.post("/buy", async (req, res) => {
  //  console.log(req.headers.authorization.split("")[1])
  const token = req.headers.authorization.split(" ")[1];
  var decoded = jwt.verify(token, "Super secret passkey");
  console.log(decoded);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
app.get("/", (req, res) => {
  res.send("Hello World!");
});

//middleware
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1]; //split by space
  if (token == null) return res.sendStatus(401);
  jwt.verify(token, "Super secret passkey", (err, decoded) => {
    console.log(err);
    if (err) {
      return res.sendStatus(403);
      req.identify = decoded;
      next();
    }
  });
}

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
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    console.log("Connected successfully to Mongobd server");
    console.log("Client: ", client.uri);
  } finally {
    // Ensures that the client will close when you finish/error
    ////await client.close();
  }
}
run().catch(console.dir);
