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

    let resq = await client.db("Assignment").collection("players").insertOne({
      name: req.body.username,
      password: hash,
      email: req.body.email,
      gender: req.body.gender,
      collection: req.body.collection,
      money: req.body.money,
    });
    res.send(resq);
  }
});

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
  let resp =
    (await client.db("Assignment").collection("players").findOne({
      name: req.body.username,
    })) ||
    (await client.db("Assignment").collection("players").findOne({
      email: req.body.email,
    }));

  console.log(resp);
  console.log(req.body);

  if (!resp) {
    res.send("User not found");
  } else {
    // Check if password is provided
    if (req.body.password) {
      if (bcrypt.compareSync(req.body.password, resp.password)) {
        res.send("Login successful");
      } else {
        res.send("Wrong Password");
      }
    } else {
      // Handle case where password is not provided
      // This is where you might decide to return an error or a specific message
      res.send("Password field is missing");
    }
  }
});

//get read user profile
app.get("/read/:id", async (req, res) => {
  let rep = await client
    .db("Assignment")
    .collection("players")
    .findOne({
      //username: req.params.username
      _id: new ObjectId(req.params.id),
    });

  res.send(rep);
  console.log(req.params);
  //console.log(rep);
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

app.post("/send_friend_request/:username", async (req, res) => {
  const fromUser = req.params.username;
  const toUser = req.body.to;

  // Check if the user exists
  const toUserExists = await client
    .db("Assignment")
    .collection("players")
    .findOne({ name: toUser });
  if (!toUserExists) {
    return res.status(400).send("User does not exist");
  }

  // Check if a request already exists
  const existingRequest = await client
    .db("Assignment")
    .collection("players")
    .findOne({
      name: toUser,
      "friendRequests.from": fromUser,
    });
  if (existingRequest) {
    return res.status(400).send("Friend request sent successfully");
  }
  // Add the friend request
  const result = await client
    .db("Assignment")
    .collection("users")
    .updateOne(
      {
        name: toUser,
      },
      {
        $push: {
          friendRequests: {
            from: fromUser,
            status: "pending",
          },
        },
      }
    );

  res.send({ message: "Friend request sent successfully" });
});

app.post("/accept_friend_request/:username", async (req, res) => {
  const toUser = req.params.username;
  const fromUser = req.body.from;

  // Find the friend request
  const user = await client.db("Assignment").collection("players").findOne({
    name: toUser,
    "friendRequests.from": fromUser,
  });

  if (!user) {
    return res.status(400).send("Friend request not found");
  }

  // Update the friend request status to accepted
  await client
    .db("Assignment")
    .collection("users")
    .updateOne(
      {
        name: toUser,
        "friendRequests.from": fromUser,
      },
      {
        $set: {
          "friendRequests.$.status": "accepted",
        },
      }
    );

  // Add the requester to the recipient's friends list
  await client
    .db("Assignment")
    .collection("users")
    .updateOne(
      {
        name: toUser,
      },
      {
        $addToSet: {
          friends: fromUser,
        },
      }
    );

  // Optionally, add the recipient to the requester's friends list
  await client
    .db("Assignment")
    .collection("users")
    .updateOne(
      {
        name: fromUser,
      },
      {
        $addToSet: {
          friends: toUser,
        },
      }
    );

  res.send({ message: "Friend request accepted" });
});
app.patch("/addfriend/:username", async (req, res) => {
  // Assuming req.body.friends is an array of friend names
  const friends = req.body.friend;

  // Check if friends array is provided and not empty
  if (!Array.isArray(friends) || friends.length === 0) {
    let existing = await client.db("Assignment").collection("users").findOne({
      name: req.body.friend,
    });

    if (existing) {
      //if array of friends not provded
      let friend_addition = await client
        .db("Assignment")
        .collection("users")
        .updateOne(
          {
            name: req.params.username,
          },
          {
            $addToSet: {
              friends: req.body.friend,
            },
          }
        );

      let friend_addition2 = await client
        .db("Assignment")
        .collection("users")
        .updateOne(
          {
            name: req.body.friend,
          },
          {
            $addToSet: {
              friends: req.params.username,
            },
          }
        );

      res.send("Add friend successfully");
      console.log(friend_addition, friend_addition2);
    } else {
      res.status(400).send("User does not exist");
    }
  } else {
    //array of friends is present
    for (const friend of friends) {
      let existing = await client.db("Assignment").collection("users").findOne({
        name: friend,
      });

      if (!existing) {
        return res.status(400).send(`User ${friend} does not exist`);
      }

      let friend_addition = await client
        .db("Assignment")
        .collection("users")
        .updateOne(
          {
            name: req.params.username,
          },
          {
            $addToSet: {
              friends: friend,
            },
          }
        );
      let friend_addition2 = await client
        .db("Assignment")
        .collection("users")
        .updateOne(
          {
            name: friend,
          },
          {
            $addToSet: {
              friends: req.params.username,
            },
          }
        );
    }

    // Send a response after all friends have been added
    res.send({ message: "Friends added successfully" });
  }
});
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

app.patch("/money_generator/:username", async (req, res) => {
  const min = 1000;
  const max = 2000;
  const newMoneyAmount = Math.floor(Math.random() * (max - min + 1)) + min;

  let user_existing = await client
    .db("Assignment")
    .collection("users")
    .findOne({
      name: req.params.username,
    });

  if (user_existing) {
    let money = await client
      .db("Assignment")
      .collection("users")
      .updateOne(
        {
          name: req.params.username,
        },
        {
          $set: {
            money: newMoneyAmount,
          },
        }
      );
    res.send(`Amount: RM ${newMoneyAmount} is given to ${req.params.username}`);
    console.log(money);
  } else {
    res.status(400).send("User not found");
  }
});

app.patch("/battle/:name1/:name2", async (req, res) => {
  let user1 = await client.db("Assignment").collection("users").findOne({
    name: req.params.name1,
  });
  let user2 = await client.db("Assignment").collection("users").findOne({
    name: req.params.name2,
  });

  if (user1 && user2) {
    if (user1.PlayerPowerLevel > user2.PlayerPowerLevel) {
      res.send(`${req.params.name1} has won the battle!!`);

      user1 = await client
        .db("Assignment")
        .collection("users")
        .updateOne(
          {
            name: req.params.name1,
          },
          {
            $inc: {
              money: 1000,
            },
          }
        );
      user1 = await client
        .db("Assignment")
        .collection("users")
        .updateOne(
          {
            name: req.params.name2,
          },
          {
            $inc: {
              money: 200,
            },
          }
        );
    } else {
      res.send(`${req.params.name2} has won the battle!!`);

      user1 = await client
        .db("Assignment")
        .collection("users")
        .updateOne(
          {
            name: req.params.name1,
          },
          {
            $inc: {
              money: 200,
            },
          }
        );
      user1 = await client
        .db("Assignment")
        .collection("users")
        .updateOne(
          {
            name: req.params.name2,
          },
          {
            $inc: {
              money: 1000,
            },
          }
        );
    }
  } else {
    res
      .status(400)
      .send(`User:${req.params.name1} and User: ${req.params.name2} not found`);
  }
});

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
