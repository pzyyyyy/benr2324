const bcrypt = require("bcrypt");
const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const { addAchievement } = require("./Achievements");

app.use(express.json());
app.use(express.static("public"));

//e.g using for registration
app.post("/register", async (req, res) => {
  let existing =
    (await client.db("Assignment").collection("players").findOne({
      name: req.body.username,
    })) ||
    (await client.db("Assignment").collection("players").findOne({
      email: req.body.email,
    }));

  if (existing) {
    res.status(400).send("username or email already exist");
  } else {
    const hash = bcrypt.hashSync(req.body.password, 10);
    let count = await client
      .db("Assignment")
      .collection("players")
      .countDocuments();
    let resq = await client
      .db("Assignment")
      .collection("players")
      .insertOne({
        name: req.body.name,
        player_id: count,
        password: hash,
        email: req.body.email,
        gender: req.body.gender,
        collection: { characterList: [], character_selected: [] },
        money: 0,
        points: 0,
        achievments: ["A beginner player"],
        friends: { friendList: [], sentRequests: [], needAcceptRequests: [] },
        //can do relationship??
        starterPackTaken: false,
      });
    res.send({
      message:
        "Congratulation! Your account register succesfully! Log in to start your battle journey!",
      data: resq,
    });
  }
});

app.patch("/login/starterpack/:numId", async (req, res) => {
  const min = 1000;
  const max = 2000;
  const newMoneyAmount = Math.floor(Math.random() * (max - min + 1)) + min;
  let user = await client
    .db("Assignment")
    .collection("players")
    .findOneAndUpdate(
      {
        $and: [
          {
            player_id: parseInt(req.params.numId),
          },
          { starterPackTaken: { $eq: false } },
        ],
      },
      { $set: { starterPackTaken: true, money: newMoneyAmount } },
      { returnOriginal: false }
    );
  if (user === null) {
    res.status(400).send("Starter pack already taken");
  } else {
    res.send(
      `Total amount of RM ${newMoneyAmount} is given to player id ${req.params.numId} `
    );
  }
});

//in funtion of adding chest
app.post("/chest", async (req, res) => {
  let existing = await client.db("Assignment").collection("chests").findOne({
    chest: req.body.chest_name,
  });
  if (existing) {
    res.status(400).send("Chest already exist");
  } else {
    let chest = await client.db("Assignment").collection("chests").insertOne({
      chest: req.body.chest_name,
    });
    res.send(chest);
  }
});
//in function of adding character
app.post("/character", async (req, res) => {
  let existing = await client
    .db("Assignment")
    .collection("characters")
    .findOne({
      name: req.body.character_name,
    });
  if (existing) {
    res.status(400).send("Character already exist");
  } else {
    let character = await client
      .db("Assignment")
      .collection("characters")
      .insertOne({
        name: req.body.character_name,
        health: req.body.health,
        attack: req.body.attack,
        defense: req.body.defense,
        type: req.body.type,
      });
    res.send(character);
  }
});

app.post("/login", async (req, res) => {
  let resp = await client
    .db("Assignment")
    .collection("players")
    .findOne({
      name:
        req.body.username ||
        (await client.db("Assignment").collection("players").findOne({
          email: req.body.email,
        })),
    });
  if (!resp) {
    res.send("User not found");
  } else {
    // Check if password is provided
    if (resp.password) {
      if (bcrypt.compareSync(req.body.password, resp.password)) {
        res.send("Login successful. Remember to gain your starter pack!");
      } else {
        res.send("Wrong Password");
      }
    } else {
      res.send("Password not provided");
    }
  }
});

//get read user profile******
app.get("/read/:player_id", async (req, res) => {
  let document = await client
    .db("Assignment")
    .collection("players")
    .aggregate([
      {
        $match: { player_id: parseInt(req.params.player_id) },
      },
      {
        $project: {
          _id: 0,
          player_id: 1,
          name: 1,
          gender: 1,
          "collection.characterList": 1,
          points: 1,
          "friends.friendList": 1,
          achievments: 1,
        },
      },
      {
        $lookup: {
          from: "players",
          localField: "friends.friendList",
          foreignField: "player_id",
          as: "aa",
        },
      },
      //add project
      {
        $lookup: {
          from: "chest",
          localField: "collection",
          foreignField: "chests",
          as: "collection",
        },
      },
      {
        $lookup: {
          from: "characters",
          localField: "collection",
          foreignField: "name",
          as: "characterInfo",
        },
      },
    ])
    .toArray();
  res.send(document);
});

//put point
app.get("/leaderboard", async (req, res) => {
  let leaderboard = await client
    .db("Assignment")
    .collection("players")
    .find()
    .sort({
      points: -1,
    })
    .toArray();

  res.send(leaderboard);
});
//need Developer token
app.patch("/add_character_to_chest", async (req, res) => {
  let result2 = await client
    .db("Assignment")
    .collection("chests")
    .findOne({ chest: req.body.chest });
  if (!result2) {
    return res.status(404).send("Chest not found");
  }
  if (result2.characters.includes(req.body.character_name)) {
    return res.status(400).send("Character already exist in the chest");
  }

  const result = await client
    .db("Assignment")
    .collection("chests")
    .updateOne(
      { chest: req.body.chest },
      { $addToSet: { characters: req.body.character_name } }
    );
  res.send("Character added successfully");
});

//need Developer token
app.patch("/characterupdate/:charactername", async (req, res) => {
  let existing = await client
    .db("Assignment")
    .collection("characters")
    .findOne({
      name: req.params.charactername,
    });
  if (!existing) {
    res.status(400).send("Character does not exist");
  } else {
    let character = await client
      .db("Assignment")
      .collection("characters")
      .updateOne(
        {
          name: req.params.charactername,
        },
        {
          $set: {
            health: req.body.health,
            attack: req.body.attack,
            speed: req.body.speed,
            type: req.body.type,
          },
        }
      );
    res.send(character);
  }
});

// To send a friend request
app.post("/send_friend_request/:requesterId/:requestedId", async (req, res) => {
  // Check if requesterId and requestedId are different
  if (parseInt(req.params.requesterId) === parseInt(req.params.requestedId)) {
    return res.status(400).send("You cannot send a friend request to yourself");
  }
  // Check if both players exist
  const requester = await client
    .db("Assignment")
    .collection("players")
    .findOne({ player_id: parseInt(req.params.requesterId) });

  const requested = await client
    .db("Assignment")
    .collection("players")
    .findOne({ player_id: parseInt(req.params.requestedId) });

  if (!requester || !requested) {
    return res.status(404).send("Either players not found");
  }
  if (requester.friends.friendList.includes(requested.player_id)) {
    return res.status(404).send("The player is already in your friend list");
  }
  // Check if friend request has already been sent
  if (
    requester &&
    requester.friends &&
    requester.friends.sentRequests &&
    requester.friends.sentRequests.indexOf(parseInt(req.params.requestedId)) !==
      -1
  ) {
    return res.status(400).send("Friend request already sent");
  }
  // Send the friend request
  const sent = await client
    .db("Assignment")
    .collection("players")
    .updateOne(
      { player_id: parseInt(req.params.requesterId) },
      { $push: { "friends.sentRequests": parseInt(req.params.requestedId) } }
    );
  const sent2 = await client
    .db("Assignment")
    .collection("players")
    .updateOne(
      { player_id: parseInt(req.params.requestedId) },
      {
        $push: {
          "friends.needAcceptRequests": parseInt(req.params.requesterId),
        },
      }
    );
  if (sent.modifiedCount === 0 && sent2.modifiedCount === 0) {
    res.status(400).send("Failed to send friend request");
  } else {
    res.send("Friend request sent");
  }
});

// To  accept a friend request
app.patch(
  "/accept_friend_request/:requestedId/:requesterId",
  async (req, res) => {
    // Check if requesterId and requestedId are different
    if (parseInt(req.params.requesterId) === parseInt(req.params.requestedId)) {
      return res
        .status(400)
        .send("You cannot accept a friend request from yourself");
    }
    // Check if both players exist
    const requester = await client
      .db("Assignment")
      .collection("players")
      .findOne({ player_id: parseInt(req.params.requesterId) });

    const requested = await client
      .db("Assignment")
      .collection("players")
      .findOne({ player_id: parseInt(req.params.requestedId) });

    if (!requester || !requested) {
      return res.status(404).send("Either players not found");
    }
    // Move the friend request from needAcceptRequests to friends
    const accept = await client
      .db("Assignment")
      .collection("players")
      .updateOne(
        {
          player_id: parseInt(req.params.requestedId),
          "friends.needAcceptRequests": parseInt(req.params.requesterId),
        },
        {
          $pull: {
            "friends.needAcceptRequests": parseInt(req.params.requesterId),
          },
          $push: { "friends.friendList": parseInt(req.params.requesterId) },
        }
      );
    console.log(accept);
    const accept2 = await client
      .db("Assignment")
      .collection("players")
      .updateOne(
        {
          player_id: parseInt(req.params.requesterId),
          "friends.sentRequests": parseInt(req.params.requestedId),
        },
        {
          $pull: { "friends.sentRequests": parseInt(req.params.requestedId) },
          $push: { "friends.friendList": parseInt(req.params.requestedId) },
        }
      );
    console.log(accept2);
    if (accept.modifiedCount === 0 && accept2.modifiedCount === 0) {
      res.status(400).send("Failed to accept friend request");
    } else {
      res.send("Friend request accepted");
    }
  }
);

app.patch("/remove_friend/:requesterId/:friendId", async (req, res) => {
  // Check if requesterId and friendId are different
  if (parseInt(req.params.requesterId) === parseInt(req.params.friendId)) {
    return res.status(400).send("You cannot remove yourself");
  }
  // Check if both players exist
  const requester = await client
    .db("Assignment")
    .collection("players")
    .findOne({ player_id: parseInt(req.params.requesterId) });

  const friend = await client
    .db("Assignment")
    .collection("players")
    .findOne({ player_id: parseInt(req.params.friendId) });

  if (!requester || !friend) {
    return res.status(404).send("Either players not found");
  }
  // Remove the friend from the friendList of the requester
  const remove1 = await client
    .db("Assignment")
    .collection("players")
    .updateOne(
      { player_id: parseInt(req.params.requesterId) },
      { $pull: { "friends.friendList": parseInt(req.params.friendId) } }
    );
  // Remove the requester from the friendList of the friend
  const remove2 = await client
    .db("Assignment")
    .collection("players")
    .updateOne(
      { player_id: parseInt(req.params.friendId) },
      { $pull: { "friends.friendList": parseInt(req.params.requesterId) } }
    );
  if (remove1.modifiedCount === 0 && remove2.modifiedCount === 0) {
    res.status(400).send("Failed to remove friend");
  } else {
    res.send("Friend removed");
  }
});

app.patch("/update/:id", async (req, res) => {
  let require = await client
    .db("Assignment")
    .collection("players")
    .updateOne(
      {
        _id: new ObjectId(req.params.id),
      },
      {
        $set: {
          name: req.body.username,
          email: req.body.email,
          gender: req.body.gender, //password??
        },
      }
    );

  res.send(require);
  console.log(req.body);
});

app.delete("/delete/:id", async (req, res) => {
  let delete_req = await client
    .db("Assignment")
    .collection("users")
    .deleteOne({
      _id: new ObjectId(req.params.id),
    });
  res.send(delete_req);
  console.log(req.params);
});

app.get("/chests", async (req, res) => {
  const chests = await client
    .db("Assignment")
    .collection("chests")
    .aggregate([{ $project: { _id: 0, chest: 1, price: 1, characters: 1 } }])
    .toArray();

  res.send(chests);
});

app.patch("/buying_chest", async (req, res) => {
  let userVerify = await client
    .db("Assignment")
    .collection("players")
    .findOne({
      $and: [{ name: req.body.name }, { email: req.body.email }],
    });
  let character = await client
    .db("Assignment")
    .collection("chests")
    .aggregate([
      { $match: { chest: req.body.chest } },
      { $unwind: "$characters" },
      { $sample: { size: 1 } },
    ])
    .toArray();
  const chest = await client.db("Assignment").collection("chests").findOne({
    chest: req.body.chest,
  });

  if (!userVerify) {
    return res.status(400).send("User or email are wrong");
  } else if (userVerify.money < chest.price) {
    return res.send(
      "Not enough money to buy chest. Please compete more battles to earn more money"
    );
  } else {
    if (chest) {
      // Check if the player has enough money
      let user = await client
        .db("Assignment")
        .collection("players")
        .findOne({
          $or: [{ name: req.body.name }, { email: req.body.email }],
        });

      if (user.money < chest.price) {
        return res.send("Not enough money to buy a character");
      } else {
        // Randomly select a character from the characters array

        // If a character was selected, add it to the user's collection
        if (user.collection.characterList.includes(character[0].characters)) {
          let powerUp = await client
            .db("Assignment")
            .collection("players")
            .updateOne(
              {
                $and: [{ name: req.body.name }, { email: req.body.email }],
              },
              {
                $inc: {
                  "collection.characterList.character[0].characters.health": 100,
                  "collection.characterList.character[0].characters.attack": 100,
                  "collection.characterList.character[0].characters.speed": 0.1,
                },
              }
            );
          return res.send(
            powerUp,
            "Character already exist in your collection, power up instead"
          );
        }
      } // Add this closing bracket
      if (character.length > 0) {
        const char = await client
          .db("Assignment")
          .collection("characters")
          .aggregate([
            {
              $match: {
                name: character[0].characters,
              },
            },
            {
              $project: {
                _id: 0,
                name: 1,
                health: 1,
                attack: 1,
                speed: 1,
                type: 1,
              },
            },
          ])
          .toArray();

        let buying = await client
          .db("Assignment")
          .collection("players")
          .updateOne(
            {
              $and: [{ name: req.body.name }, { email: req.body.email }],
            },
            {
              $push: {
                "collection.characterList": char.body,
              },
              $inc: {
                money: -chest.price,
              },
            }
          );
        return res.send(
          "Chest bought successfully, you got " + character[0].characters
        );
      } else {
        res.send("No characters available in the chest");
      }
      {
        res.send("Chest not found");
      }
    }
  }
});
//dunno yet
// app.patch("/buying_chest", async (req, res) => {
//   const { name, email, chest: chestName } = req.body;

//   const user = await client
//     .db("Assignment")
//     .collection("players")
//     .findOne({ name, email });
//   const chest = await client
//     .db("Assignment")
//     .collection("chests")
//     .findOne({ chest: chestName });

//   if (!user) {
//     return res.status(400).send("User or email are wrong");
//   }

//   if (!chest || user.money < chest.price) {
//     return res.send(
//       "Not enough money to buy chest. Please compete more battles to earn more money"
//     );
//   }

//   const character = await client
//     .db("Assignment")
//     .collection("chests")
//     .aggregate([
//       { $match: { chest: chestName } },
//       { $unwind: "$characters" },
//       { $sample: { size: 1 } },
//     ])
//     .toArray();

//   if (character.length === 0) {
//     return res.send("No characters available in the chest");
//   }

//   const characterName = character[0].characters;

//   if (user.collection.characterList.includes(characterName)) {
//     await client
//       .db("Assignment")
//       .collection("players")
//       .updateOne(
//         { name, email },
//         {
//           $inc: {
//             "collection.characterList.character[0].characters.health": 100,
//             "collection.characterList.character[0].characters.attack": 100,
//             "collection.characterList.character[0].characters.speed": 0.1,
//           },
//         }
//       );

//     return res.send({
//       message: "Character already exist in your collection, power up instead",
//     });
//   }

//   const char = await client
//     .db("Assignment")
//     .collection("character")
//     .aggregate([
//       { $match: { name: characterName } },
//       {
//         $project: { _id: 0, name: 1, health: 1, attack: 1, speed: 1, type: 1 },
//       },
//     ])
//     .toArray();

//   await client
//     .db("Assignment")
//     .collection("players")
//     .updateOne(
//       { name, email },
//       {
//         $push: { "collection.characterList": char },
//         $inc: { money: -chest.price },
//       }
//     );

//   res.send({ message: "Chest bought successfully, you got " + characterName });
// });

app.get("/battle/:id", async (req, res) => {
  const name = await client
    .db("Assignment")
    .collection("players")
    .aggregate([
      {
        $match: { name: req.params.selectName },
      },
      {
        $project: {
          _id: 0,
          name: 1,
          point: 1,
          collection: 1,
        },
      },
    ])
    .toArray();

  if (player) {
    res.send(name);
  } else {
    res.status(400).send("Player not found");
  }
});

app.post("/battle", async (req, res) => {
  // Get the attacker and defender from the database
  const attacker = await client
    .db("Assignment")
    .collection("players")
    .findOne({
      $and: { player_id: parseInt(req.body.name), name: req.body.name },
    });

  const defender = await client
    .db("Assignment")
    .collection("players")
    .aggregate([{ $sample: { size: 1 } }])
    .toArray();

  // Calculate the new health of the defender
  const newHealth = defender.health - attacker.attackPower * attacker.speed;

  // Update the defender's health in the database
  await client
    .db("Game")
    .collection("Players")
    .updateOne({ name: defenderName }, { $set: { health: newHealth } });

  // If the defender's new health is less than or equal to 0, they lost the battle
  if (newHealth <= 0) {
    res.json({
      message: `${defenderName} lost the battle. Do you want to attack again?`,
    });
  } else {
    res.json({
      message: `${defenderName} now has ${newHealth} health. Do you want to attack again?`,
    });
  }
});

// app.patch("/battle/:name1/:name2", async (req, res) => {
//   let user1 = await client.db("Assignment").collection("users").findOne({
//     name: req.params.name1,
//   });
//   let user2 = await client.db("Assignment").collection("users").findOne({
//     name: req.params.name2,
//   });

//   if (user1 && user2) {
//     if (user1.PlayerPowerLevel > user2.PlayerPowerLevel) {
//       res.send(`${req.params.name1} has won the battle!!`);

//       user1 = await client
//         .db("Assignment+")
//         .collection("users")
//         .updateOne(
//           {
//             name: req.params.name1,
//           },
//           {
//             $inc: {
//               money: 1000,
//             },
//           }
//         );
//       user1 = await client
//         .db("Assignment")
//         .collection("users")
//         .updateOne(
//           {
//             name: req.params.name2,
//           },
//           {
//             $inc: {
//               money: 200,
//             },
//           }
//         );
//     } else {
//       res.send(`${req.params.name2} has won the battle!!`);

//       user1 = await client
//         .db("Assignment")
//         .collection("users")
//         .updateOne(
//           {
//             name: req.params.name1,
//           },
//           {
//             $inc: {
//               money: 200,
//             },
//           }
//         );
//       user1 = await client
//         .db("Assignment")
//         .collection("users")
//         .updateOne(
//           {
//             name: req.params.name2,
//           },
//           {
//             $inc: {
//               money: 1000,
//             },
//           }
//         );
//     }
//   } else {
//     res
//       .status(400)
//       .send(`User:${req.params.name1} and User: ${req.params.name2} not found`);
//   }
// });

//delete user profile

app.patch("/achievements/:player_id", async (req, res) => {
  try {
    let user = await client
      .db("Assignment")
      .collection("players")
      .findOneAndUpdate(
        { player_id: req.params.player_id },
        { $set: { achievements: { battlesWon: 1, battlesLost: 0 } } }
      );

    if (user) {
      if (user.achievements) {
        res.status(400).send("Achievements already retrieved");
      } else {
        await client
          .db("Assignment")
          .collection("players")
          .updateOne(
            {
              name: req.params.username,
            },
            {
              $set: {
                achievements: {
                  battlesWon: 0,
                  battlesLost: 0,
                },
              },
            }
          );
        res.send("Achievements given");
      }
    } else {
      res.status(400).send("User not found");
    }
  } catch (error) {
    res.status(500).send("Server error");
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
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);
