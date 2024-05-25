const bcrypt = require("bcrypt");
const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

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
        name: req.body.username,
        player_id: count,
        password: hash,
        email: req.body.email,
        gender: req.body.gender,
        collection: [],
        money: 0,
        points: 0,
        achievments: [],
        friends: [
          {
            friend_id: 0,
            sentRequests: [],
          },
        ], //can do relationship??
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
      `Total amount of RM ${newMoneyAmount} is given to ${req.params.numId} player`
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

//get read user profile
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
          collection: 1,
          points: 1,
          achievments: 1,
        },
      },
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

app.get("/leaderboard", async (req, res) => {
  let leaderboard = await client
    .db("Assignment")
    .collection("players")
    .find()
    .sort({
      PlayerPowerLevel: -1,
    })
    .toArray();

  res.send(leaderboard);
});
//need Developer token
app.patch("/add_character_to_chest/:chestId", async (req, res) => {
  const Character = req.body.character_name;

  const existingChest = await client
    .db("Assignment")
    .collection("chests")
    .findOne({
      _id: new ObjectId(req.params.chestId),
    });

  const existingCharacter = await client
    .db("Assignment")
    .collection("characters")
    .findOne({
      name: Character,
    });

  if (Array.isArray(Character)) {
    if (!existingCharacter && !existingChest) {
      res.status(400).send("Chest or character does not exist");
    } else {
      let character_power_level = 0;

      for (const character of Character) {
        let individual_character_power = await client
          .db("Assignment")
          .collection("characters")
          .findOne({
            name: character,
          });
        character_power_level += individual_character_power.character_power;
      }

      if (existingChest.total_power_level) {
        character_power_level =
          character_power_level + existingChest.total_power_level;
      }

      let chest = await client
        .db("Assignment")
        .collection("chests")
        .updateOne(
          {
            _id: new ObjectId(req.params.chestId),
          },
          {
            $set: {
              total_power_level: character_power_level,
            },
            $addToSet: {
              characters: {
                $each: Character,
              },
            },
          }
        );
      res.send({ message: "Characters added to chest" });
    }
  } else {
    if (!existingChest && !existingCharacter) {
      res.status(400).send("Chest or Character does not exist");
    } else {
      let character_power_level = 0;
      let individual_character_power = await client
        .db("Assignment")
        .collection("characters")
        .findOne({
          name: req.body.character_name,
        });
      character_power_level += individual_character_power.character_power;

      let chest = await client
        .db("Assignment")
        .collection("chests")
        .updateOne(
          {
            _id: new ObjectId(req.params.chestId),
          },
          {
            $set: {
              total_power_level: character_power_level,
            },
            $addToSet: {
              //chest: req.body.chest_name,
              characters: req.body.character_name,
            },
          }
        );
      res.send({ message: "Character added to chest" });
    }
  }
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
            defense: req.body.defense,
            type: req.body.type,
            character_power: req.body.character_power,
          },
        }
      );
    res.send(character);
  }
});

// Endpoint to send a friend request
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
  // Check if friend request has already been sent
  if (
    requester &&
    requester.sentRequests &&
    requester.sentRequests.indexOf(parseInt(req.params.requestedId)) !== -1
  ) {
    return res.status(400).send("Friend request already sent");
  }
  // Send the friend request
  const result = await client
    .db("Assignment")
    .collection("players")
    .updateOne(
      { player_id: parseInt(req.params.requesterId) },
      { $push: { sentRequests: parseInt(req.params.requestedId) } }
    );

  if (result.modifiedCount === 0) {
    res.status(400).send("Failed to send friend request");
  } else {
    res.send("Friend request sent");
  }
});

// // Endpoint to accept a friend request
app.patch(
  "/accept_friend_request/:requesterId/:requestedId",
  async (req, res) => {
    const requesterId = parseInt(req.params.requesterId);
    const requestedId = parseInt(req.params.requestedId);

    // Move the friend request from sentRequests to friends
    const result = await client
      .db("Assignment")
      .collection("players")
      .updateOne(
        { player_id: requestedId, sentRequests: requesterId },
        {
          $pull: { sentRequests: requesterId },
          $push: { friends: requesterId },
        }
      );

    if (result.modifiedCount === 0) {
      res.status(400).send("Failed to accept friend request");
    } else {
      res.send("Friend request accepted");
    }
  }
);

// app.patch("/addfriend/numId", async (req, res) => {
//   // Assuming req.body.friends is an array of friend names
//   const friends = req.body.friend_id;

//   // Check if friends array is provided and not empty
//   if (!Array.isArray(friends) || friends.length === 0) {
//     let existing = await client.db("Assignment").collection("users").findOne({
//       player_id: req.body.friend_id
//     });

//     if (existing) {
//       //if array of friends not provded
//       let friend_addition = await client
//         .db("Assignment")
//         .collection("users")
//         .updateOne(
//           {
//             player_id: req.params.numId,
//           },
//           {
//             $addToSet: {
//               friends: req.body.friend_id,
//             },
//           }
//         );

//       let friend_addition2 = await client
//         .db("Assignment")
//         .collection("users")
//         .updateOne(
//           {
//             name: req.body.friend,
//           },
//           {
//             $addToSet: {
//               friends: req.params.username,
//             },
//           }
//         );

//       res.send("Add friend successfully");
//       console.log(friend_addition, friend_addition2);
//     } else {
//       res.status(400).send("User does not exist");
//     }
//   } else {
//     //array of friends is present
//     for (const friend of friends) {
//       let existing = await client.db("Assignment").collection("users").findOne({
//         name: friend,
//       });

//       if (!existing) {
//         return res.status(400).send(`User ${friend} does not exist`);
//       }

//       let friend_addition = await client
//         .db("Assignment")
//         .collection("users")
//         .updateOne(
//           {
//             name: req.params.username,
//           },
//           {
//             $addToSet: {
//               friends: friend,
//             },
//           }
//         );
//       let friend_addition2 = await client
//         .db("Assignment")
//         .collection("users")
//         .updateOne(
//           {
//             name: friend,
//           },
//           {
//             $addToSet: {
//               friends: req.params.username,
//             },
//           }
//         );
//     }

//     // Send a response after all friends have been added
//     res.send({ message: "Friends added successfully" });
//   }
// });

app.patch("/removefriend/:username", async (req, res) => {
  // Assuming req.body.friends is an array of friend names
  const friends_removed = req.body.friend_to_be_removed;

  // Check if friends array is provided and not empty
  if (!Array.isArray(friends_removed) || friends_removed.length === 0) {
    //if array of friends not provded
    let existing = await client.db("Assignment").collection("users").findOne({
      name: req.body.friend_to_be_removed,
    });

    if (existing) {
      let removing_friend = await client
        .db("Assignment")
        .collection("users")
        .updateOne(
          {
            name: req.params.username,
          },
          {
            $pull: {
              friends: req.body.friend_to_be_removed,
            },
          }
        );

      let removing_friend2 = await client
        .db("Assignment")
        .collection("users")
        .updateOne(
          {
            name: req.body.friend_to_be_removed,
          },
          {
            $pull: {
              friends: req.params.username,
            },
          }
        );

      res.send("friend removed successfully");
      console.log(removing_friend, removing_friend2);
    } else {
      res.status(400).send("User does not exist");
    }
  } else {
    //array of friends is present
    for (const friends of friends_removed) {
      let existing = await client.db("Assignment").collection("users").findOne({
        name: friends,
      });

      if (!existing) {
        return res.status(400).send(`User ${friends_removed} does not exist`);
      }

      let removing_friend = await client
        .db("Assignment")
        .collection("users")
        .updateOne(
          {
            name: req.params.username,
          },
          {
            $pull: {
              friends: friends,
            },
          }
        );
      let removing_friend2 = await client
        .db("Assignment")
        .collection("users")
        .updateOne(
          {
            name: friends,
          },
          {
            $pull: {
              friends: req.params.username,
            },
          }
        );
    }

    // Send a response after all friends have been added
    res.send({ message: "Friends removed successfully" });
  }
});

//update user profile
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
          gender: req.body.gender,
        },
      }
    );

  res.send(require);
  console.log(req.body);
});

app.patch("/buying_chest/:username", async (req, res) => {
  let user_existing =
    (await client.db("Assignment").collection("users").findOne({
      name: req.params.username,
    })) ||
    (await client.db("Assignment").collection("users").findOne({
      email: req.params.username,
    }));

  let chest_existing = await client
    .db("Assignment")
    .collection("chests")
    .findOne({
      chest: req.body.collection,
    });
  console.log(user_existing, chest_existing);

  if (user_existing.money < chest_existing.price) {
    res.send(
      "Not enough money to buy chest. Please compete more battles to earn more money"
    );
  } else {
    if (user_existing && chest_existing) {
      let buying = await client
        .db("Assignment")
        .collection("users")
        .updateOne(
          {
            $or: [
              {
                //filter by username or email
                name: req.params.username,
              },
              {
                email: req.params.username,
              },
            ],
          },
          {
            //operation
            $addToSet: {
              collection: req.body.collection,
            },
            $inc: {
              PlayerPowerLevel: chest_existing.total_power_level,
              money: -chest_existing.price,
            },
          }
        );
      res.send("Chest bought successfully");
      console.log(buying);
      console.log(req.body);
    } else {
      res.status(400).send("User or chest not found");
    }
  }
});

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
          shield: 1,
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

app.post("/battle/:attackerID:/:defenderID", async (req, res) => {
  // Get the attacker and defender from the database
  const attacker = await client
    .db("Game")
    .collection("Players")
    .findOne({ id: attackerID });
  const defender = await client
    .db("Game")
    .collection("Players")
    .findOne({ id: defenderID });

  // Calculate the new health of the defender
  const newHealth = defender.health - attacker.attackPower;

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

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

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
