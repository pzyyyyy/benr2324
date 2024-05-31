const bcrypt = require("bcrypt");
const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const { addAchievement } = require("./Achievements");

app.use(express.json());
app.use(express.static("public"));

//e.g using for registration
app.post("/register", async (req, res) => {
  if (
    !req.body.name ||
    !req.body.email ||
    !req.body.password ||
    !req.body.gender
  ) {
    return res
      .status(400)
      .send("name,email,password and gender are required.\n(ू˃̣̣̣̣̣̣︿˂̣̣̣̣̣̣ ू)");
  }
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
    let countNum = await client
      .db("Assignment")
      .collection("characters_of_players")
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
        //I set them as default ya
        collection: {
          characterList: ["Lillia"],
          character_selected: { name: "Lillia", charId: countNum },
          charId: [countNum],
        },
        money: 0,
        points: 0,
        achievments: ["A beginner player"],
        friends: { friendList: [], sentRequests: [], needAcceptRequests: [] },
        //can do relationship??
        starterPackTaken: false,
      });
    let Lilla = await client
      .db("Assignment")
      .collection("characters")
      .aggregate([
        {
          $match: { name: "Lillia" },
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
    console.log(Lilla);
    await client
      .db("Assignment")
      .collection("characters_of_players")
      .insertOne({ char_id: countNum, characters: Lilla }, { upsert: true });

    res.send(
      "Congratulation! Your account register succesfully!\nLog in to start your battle journey! \n( ◑‿◑)ɔ┏🍟--🍔┑٩(^◡^ )"
    );
  }
});

app.patch("/login", async (req, res) => {
  if (!req.body.name || !req.body.email) {
    return res.status(400).send("Invalid request body");
  }
  let resp = await client
    .db("Assignment")
    .collection("players")
    .findOne({
      name:
        req.body.name &&
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
        res.send(
          "Login successful. Remember to gain your starter pack!\n(っ＾▿＾)۶🍸🌟🍺٩(˘◡˘ )"
        );
      } else {
        res.send("Wrong Password");
      }
    } else {
      res.send("Password not provided");
    }
  }
});

app.patch("/login/starterpack", async (req, res) => {
  if (!req.body.name) {
    return res.status(400).send("Invalid request body");
  }
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
            name: req.body.name,
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
      `Total amount of RM ${newMoneyAmount} is given to player ${req.body.name}`
    );
  }
});

//in funtion of adding chest
app.post("/chests", async (req, res) => {
  if (
    !req.body.chest ||
    !req.body.price ||
    !req.body.characters ||
    !req.body.Max_power_level
  ) {
    return res.status(400).send("Invalid request body");
  }
  let existing = await client.db("Assignment").collection("chests").findOne({
    chest: req.body.chest,
  });
  if (existing) {
    res.status(400).send("Chest already exist");
  } else {
    if (req.body.characters.includes(req.body.character)) {
      return res.status(400).send("Character already in characters array");
    }
    let chest = await client.db("Assignment").collection("chests").insertOne({
      chest: req.body.chest,
      price: req.body.price,
      characters: req.body.characters,
      Max_power_level: req.body.Max_power_level,
    });
    res.send(chest);
  }
});
//in function of adding character
app.post("/character", async (req, res) => {
  if (
    !req.body.character_name ||
    !req.body.health ||
    !req.body.attack ||
    !req.body.type ||
    !req.body.speed
  ) {
    return res.status(400).send("Invalid request body");
  }
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
        type: req.body.type,
      });
    res.send(character);
  }
});

//everyone can read each other
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
          as: "friendsInfo",
        },
      },
      {
        $project: {
          player_id: 1,
          name: 1,
          gender: 1,
          "collection.characterList": 1,
          points: 1,
          achievments: 1,
          "friendsInfo.player_id": 1,
          "friendsInfo.name": 1,
        },
      },
      {
        $lookup: {
          from: "characters",
          localField: "collection.characterList",
          foreignField: "name",
          as: "characterInfo",
        },
      },
      {
        $project: {
          player_id: 1,
          name: 1,
          gender: 1,
          "characterInfo.name": 1,
          "characterInfo.health": 1,
          "characterInfo.attack": 1,
          "characterInfo.speed": 1,
          "characterInfo.type": 1,
          points: 1,
          achievments: 1,
          "friendsInfo.player_id": 1,
          "friendsInfo.name": 1,
        },
      },
    ])
    .toArray();
  res.send(document);
});

//need Developer token
app.patch("/add_character_to_chest", async (req, res) => {
  if (!req.body.chest || !req.body.character_name) {
    return res.status(400).send("Invalid request body");
  }
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
  if (
    !req.body.health ||
    !req.body.attack ||
    !req.body.speed ||
    !req.body.type
  ) {
    return res
      .status(400)
      .send("health,attack,speed and type are required.（＞д＜）");
  }
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
app.post("/send_friend_request", async (req, res) => {
  if (!req.body.requesterId || !req.body.requestedId) {
    return res
      .status(400)
      .send("requesterId and requestedId are required. (◡́.◡̀)(^◡^ )");
  }
  // Check if requesterId and requestedId are different
  if (parseInt(req.body.requesterId) === parseInt(req.body.requestedId)) {
    return res.status(400).send("You cannot send a friend request to yourself");
  }
  // Check if both players exist
  const requester = await client
    .db("Assignment")
    .collection("players")
    .findOne({ player_id: parseInt(req.body.requesterId) });

  const requested = await client
    .db("Assignment")
    .collection("players")
    .findOne({ player_id: parseInt(req.body.requestedId) });

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
    requester.friends.sentRequests.indexOf(parseInt(req.body.requestedId)) !==
      -1
  ) {
    return res.status(400).send("Friend request already sent");
  }
  // Send the friend request
  const sent = await client
    .db("Assignment")
    .collection("players")
    .updateOne(
      { player_id: parseInt(req.body.requesterId) },
      { $push: { "friends.sentRequests": parseInt(req.body.requestedId) } }
    );
  const sent2 = await client
    .db("Assignment")
    .collection("players")
    .updateOne(
      { player_id: parseInt(req.body.requestedId) },
      {
        $push: {
          "friends.needAcceptRequests": parseInt(req.body.requesterId),
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
app.patch("/accept_friend_request", async (req, res) => {
  if (!req.body.accepterId || !req.body.requesterId) {
    return res.status(400).send("accepterId and requesterId are required");
  }
  if (parseInt(req.body.accepterId) === parseInt(req.body.requesterId)) {
    return res
      .status(400)
      .send("You cannot accept a friend request from yourself");
  }
  // Check if both players exist
  const requester = await client
    .db("Assignment")
    .collection("players")
    .findOne({ player_id: parseInt(req.body.requesterId) });

  const accepter = await client
    .db("Assignment")
    .collection("players")
    .findOne({ player_id: parseInt(req.body.accepterId) });

  if (!requester || !accepter) {
    return res.status(404).send("Either players not found");
  }
  // Move the friend request from needAcceptRequests to friends
  const accept = await client
    .db("Assignment")
    .collection("players")
    .updateOne(
      {
        player_id: parseInt(req.body.accepterId),
        "friends.needAcceptRequests": parseInt(req.body.requesterId),
      },
      {
        $pull: {
          "friends.needAcceptRequests": parseInt(req.body.requesterId),
        },
        $push: { "friends.friendList": parseInt(req.body.requesterId) },
      }
    );
  console.log(accept);
  const accept2 = await client
    .db("Assignment")
    .collection("players")
    .updateOne(
      {
        player_id: parseInt(req.body.requesterId),
        "friends.sentRequests": parseInt(req.body.accepterId),
      },
      {
        $pull: { "friends.sentRequests": parseInt(req.body.accepterId) },
        $push: { "friends.friendList": parseInt(req.body.accepterId) },
      }
    );
  console.log(accept2);
  if (accept.modifiedCount === 0 && accept2.modifiedCount === 0) {
    res.status(400).send("Failed to accept friend request");
  } else {
    res.send("Friend request accepted");
    if (player.friends.friendList.length > 5) {
      await client
        .db("Assignment")
        .collection("players")
        .updateOne(
          { player_id: parseInt(req.body.accepterId) },
          { $addToSet: { achievements: "Makes more friends" } }
        );
    }
  }
});

app.patch("/remove_friend/:requesterId/:friendId", async (req, res) => {
  // Check if requesterId and friendId are different
  if (parseInt(req.params.requesterId) === parseInt(req.params.friendId)) {
    return res.status(400).send("You cannot remove yourself (╯ ͠° ͟ʖ ͡°)╯┻━┻");
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

app.patch("/update/:object_id", async (req, res) => {
  if (
    !req.body.name ||
    !req.body.email ||
    !req.body.password ||
    !req.body.gender
  ) {
    return res.status(400).send("Invalid request body");
  }
  let require = await client
    .db("Assignment")
    .collection("players")
    .updateOne(
      {
        _id: new ObjectId(req.params.object_id),
      },
      {
        $set: {
          name: req.body.username,
          email: req.body.email,
          gender: req.body.gender, //password??
          password: hash,
        },
      }
    );
  if (require.modifiedCount === 0) {
    res.status(400).send("Updated failed");
  } else {
    res.send("Profile updated successfully");
  }
});

app.delete("/delete/:object_id", async (req, res) => {
  let delete_req = await client
    .db("Assignment")
    .collection("users")
    .deleteOne({
      _id: new ObjectId(req.params.object_id),
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
  if (!req.body.name || !req.body.email || !req.body.chest) {
    return res.status(400).send("Invalid request body");
  }
  let player = await client
    .db("Assignment")
    .collection("players")
    .findOne({
      $and: [{ name: req.body.name }, { email: req.body.email }],
    });
  let chest = await client.db("Assignment").collection("chests").findOne({
    chest: req.body.chest,
  });
  // Randomly select a character from the characters array
  let character_in_chest = await client
    .db("Assignment")
    .collection("chests")
    .aggregate([
      { $match: { chest: req.body.chest } },
      { $unwind: "$characters" },
      { $sample: { size: 1 } },
      {
        $lookup: {
          from: "characters",
          localField: "characters",
          foreignField: "name",
          as: "characters",
        },
      },
    ])
    .toArray();
  console.log(player);
  console.log(character_in_chest[0]);
  console.log(character_in_chest[0].characters);
  console.log(character_in_chest[0].characters[0].name);
  console.log(chest);

  if (!player) {
    return res.status(400).send("User or email are wrong");
  }
  // Check if the player has enough money
  if (player.money < chest.price) {
    return res.send(
      "Not enough money to buy chest. Please compete more battles to earn more money"
    );
  }

  if (chest) {
    if (
      player.collection.characterList.includes(
        character_in_chest[0].characters[0].name
      )
    ) {
      let index = player.collection.characterList.indexOf(
        character_in_chest[0].characters[0].name
      );
      console.log(index);
      let your_char = await client
        .db("Assignment")
        .collection("characters_of_players")
        .findOneAndUpdate(
          {
            char_id: index,
          },
          {
            $inc: {
              "characters.$[].health": 100,
              "characters.$[].attack": 100,
              "characters.$[].speed": 0.1,
            },
          }
        );
      console.log(your_char);
      return res.send(
        // powerUp,
        character_in_chest[0].characters[0].name +
          ` already exist in your collection, power up instead` +
          your_char
      );
    } else {
      let buying = await client
        .db("Assignment")
        .collection("players")
        .updateOne(
          {
            player_id: player.player_id,
          },
          {
            $addToSet: {
              "collection.characterList":
                character_in_chest[0].characters[0].name,
            },
            $inc: {
              money: -chest.price,
            },
            $set: {
              upset: true,
            },
          }
        );
      console.log(buying);
      if (buying.modifiedCount === 0) {
        return res.send("Failed to buy character");
      } else {
        let countNum = await client
          .db("Assignment")
          .collection("characters_of_players")
          .countDocuments();
        let randomChar = await client
          .db("Assignment")
          .collection("characters")
          .aggregate([
            {
              $match: { name: character_in_chest[0].characters[0].name },
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
        await client
          .db("Assignment")
          .collection("characters_of_players")
          .insertOne({ char_id: countNum, characters: randomChar });
        await client
          .db("Assignment")
          .collection("players")
          .updateOne(
            { player_id: player.player_id },
            {
              $push: {
                "collection.charId": countNum,
                // name: character_in_chest[0].characters,
              },
            },
            { upsert: true }
          );
        // Check if the player has collected 21 characters
        if (player.collection.characterList.length === 21) {
          await client
            .db("Assignment")
            .collection("players")
            .updateOne(
              { player_id: player.player_id },
              {
                $addToSet: {
                  achievements:
                    "Congraturation! You complete the characters collection",
                },
              }
            );
        }
        return res.send(
          "Chest bought successfully, you got " +
            character_in_chest[0].characters[0].name +
            " in your collection."
        );
      }
    }
  } else {
    res.send("Chest not found");
  }
});

//put point
app.get("/leaderboard", async (req, res) => {
  let leaderboard = await client
    .db("Assignment")
    .collection("players")
    .aggregate([
      {
        $sort: {
          points: -1,
        },
      },
      {
        $project: {
          _id: 0,
          name: 1,
          player_id: 1,
          gender: 1,
          points: 1,
        },
      },
    ])
    .toArray();
  if (leaderboard.length > 0) {
    // Give achievement to the top player
    await client
      .db("Assignment")
      .collection("players")
      .updateOne(
        { player_id: leaderboard[0].player_id },
        { $addToSet: { achievements: "You are the Top of King in this Game" } }
      );
  }
  res.send(leaderboard);
});

app.patch("/change_selected_char", async (req, res) => {
  if (!req.body.name || !req.body.email || !req.body.character_selected) {
    return res.status(400).send("Invalid request body");
  }
  let player = await client
    .db("Assignment")
    .collection("players")
    .findOne({
      $and: [{ name: req.body.name }, { email: req.body.email }],
    });
  if (!player) {
    return res.status(404).send("Player not found");
  }
  let index = player.collection.characterList.indexOf(
    req.body.character_selected
  );
  if (index === -1) {
    return res.status(400).send("Character not found in character list");
  }
  if (!Array.isArray(player.collection.charId)) {
    return res.status(400).send("Character ID list not found");
  }
  const char_id = player.collection.charId[index];

  let read_id = await client
    .db("Assignment")
    .collection("characters_of_players")
    .findOne({ char_id: char_id });
  if (!read_id) {
    return res.status(404).send("Character not found");
  }

  let selected_char = await client
    .db("Assignment")
    .collection("players")
    .updateOne(
      { name: req.body.name },
      {
        $set: {
          "collection.character_selected.name": req.body.character_selected,
          "collection.character_selected.charId": char_id,
        },
      }
    );
  if (selected_char.modifiedCount === 0) {
    return res.status(400).send("Failed to change selected character");
  } else {
    res.send(
      "Your selected character has been changed to " +
        req.body.character_selected
    );
  }
});

app.patch("/battle", async (req, res) => {
  if (!req.body.name || !req.body.email) {
    return res.status(400).send("Invalid request body");
  }

  const user = await client
    .db("Assignment")
    .collection("players")
    .findOne({
      $and: [
        {
          name: req.body.name,
          email: req.body.email,
        },
      ],
    });
  if (!user) {
    return res.status(404).send("Player not found");
  } else if (user.collection.character_selected === null) {
    return res.status(400).send("Character not selected");
  }
  let attacker = await client
    .db("Assignment")
    .collection("players")
    .aggregate([
      { $match: { name: req.body.name } },
      { $project: { _id: 0, name: 1, player_id: 1, collection: 1 } },
    ])
    .toArray();
  //avoid the same player found
  let defender;
  do {
    defender = await client
      .db("Assignment")
      .collection("players")
      .aggregate([
        { $sample: { size: 1 } },
        { $project: { _id: 0, name: 1, player_id: 1, collection: 1 } },
      ])
      .toArray();
  } while (attacker[0].player_id === defender[0].player_id);

  console.log(attacker[0]);
  console.log(defender[0]);
  if (!attacker[0] || !defender[0]) {
    return res.status(400).send("Player not found");
  }
  //need to read char of player*******
  const charId_attacker = attacker[0].collection.character_selected.charId;
  const charId_defender = defender[0].collection.character_selected.charId;
  console.log(charId_attacker);
  console.log(charId_defender);

  let attacker_character = await client
    .db("Assignment")
    .collection("characters_of_players")
    .findOne({ char_id: charId_attacker });
  let defender_character = await client
    .db("Assignment")
    .collection("characters_of_players")
    .findOne({ char_id: charId_defender });
  console.log(attacker_character);
  console.log(defender_character);
  let battle_round = 0;
  let newHealthDefender;
  let newHealthAttacker;

  if (attacker_character && defender_character) {
    do {
      newHealthDefender =
        defender_character.characters[0].health -
        attacker_character.characters[0].attack *
          attacker_character.characters[0].speed;
      newHealthAttacker =
        attacker_character.characters[0].health -
        defender_character.characters[0].attack *
          defender_character.characters[0].speed;

      // Update the characters' health
      defender_character.characters[0].health = newHealthDefender;
      attacker_character.characters[0].health = newHealthAttacker;

      battle_round++;
    } while (
      defender_character.characters[0].health > 0 &&
      attacker_character.characters[0].health > 0
    );

    console.log(battle_round);
    console.log("Attacker health left: ", newHealthDefender);
    console.log("Defender health left: ", newHealthAttacker);
  } else {
    return res.status(400).send("Character not found");
  }

  let winner =
    newHealthAttacker > newHealthDefender ? attacker[0].name : defender[0].name;
  let loser =
    newHealthAttacker < newHealthDefender ? attacker[0].name : defender[0].name;

  if (newHealthAttacker === newHealthDefender) {
    return res.send("Draw. Try attack again with your luck and brain👋≧◉ᴥ◉≦");
  } else {
    if (battle_round > 0) {
      let battleRecord = {
        attacker: attacker[0].name,
        defender: defender[0].name,
        battleRound: battle_round,
        winner: winner,
        date: new Date(),
      };
      console.log(winner);
      console.log(loser);
      console.log(battleRecord);
      if (newHealthAttacker <= 0) {
        res.send(`Nice try, you will be better next time!≧◠ᴥ◠≦✊`);
      } else {
        await client
          .db("Assignment")
          .collection("battle_record")
          .insertOne({ battleRecord });

        await client
          .db("Assignment")
          .collection("players")
          .updateOne(
            { name: winner },
            {
              $inc: { points: 3, money: 500 },
              $set: {
                notification: `Congratulations, you won a battle!≧◠‿◠≦✌`,
              },
            },
            { upsert: true }
          );

        // First, decrease the points
        await client
          .db("Assignment")
          .collection("players")
          .updateOne(
            { name: loser },
            {
              $inc: { points: -1 },
              $set: {
                notification: "You are being attacked in the game!( ˘︹˘ )",
              },
            },
            { upsert: true }
          );

        // Then, ensure that points are not less than 0
        await client
          .db("Assignment")
          .collection("players")
          .updateOne(
            { name: loser, points: { $lt: 0 } },
            {
              $set: { points: 0 },
            }
          );

        let playerRecord = await client
          .db("Assignment")
          .collection("players")
          .findOne({ name: winner });

        if (
          playerRecord &&
          playerRecord.achievements &&
          !playerRecord.achievements.includes("First win")
        ) {
          await client
            .db("Assignment")
            .collection("players")
            .updateOne(
              { name: winner },
              {
                $push: {
                  characters: {
                    _id: countNum,
                    name: character_in_chest[0].characters,
                  },
                },
                $addToSet: {
                  achievements: "First win",
                },
              },
              { upsert: true }
            );
        }
        res.send(
          `Congratulations, you won the battle after ${battle_round} rounds!`
        );
      }
    } else {
      res.send("Battle failed");
    }
  }
});

app.get("/achievements/:player_id", async (req, res) => {
  let user = await client
    .db("Assignment")
    .collection("players")
    .findOne({
      player_id: req.params.player_id,
      achievements: { $exists: true },
    });
  if (!user) {
    res.status(404).send("Find a way to get your achievements!");
  }
  res.send(user.achievements);
});

app.get("/read_battle_record/:player_id", async (req, res) => {
  let history = await client
    .db("Assignment")
    .collection("battle_record")
    .find({
      $or: [
        { "battleRecord.attacker": req.params.player_id },
        { "battleRecord.defender": req.params.player_id },
      ],
    })
    .toArray();

  console.log(history);

  if (history.length === 0) {
    return res.status(404).send("No history found for this player");
  }

  res.send(history);
});

// const rateLimit = require("express-rate-limit");

// // Enable rate limiting
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100 // limit each IP to 100 requests per windowMs
// });

// app.use(limiter);

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
