async function main() {
  const { MongoClient } = require("mongodb");
  const uri =
    "mongodb+srv://b022210255:12345abc@cluster0.wge1mil.mongodb.net/sample_analytics?retryWrites=true&w=majority";
  const client = new MongoClient(uri);
  try {
    await client.connect();
    await listDatabases(client);
    // Run the aggregation pipeline to find Leslie Martinez
    await findLeslieMartinez(client);
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}

async function listDatabases(client) {
  const databasesList = await client.db().admin().listDatabases();
  console.log("Databases:");
  databasesList.databases.forEach((db) => {
    console.log(` - ${db.name}`);
  });
}

async function findLeslieMartinez(client) {
  // Execute the aggregation pipeline
  const resultA = await client
    .db("sample_analytics")
    .collection("customers")
    .aggregate([
      {
        $match: {
          name: "Leslie Martinez",
        },
      },
      {
        $project: {
          _id: 0,
          name: 1,
          email: 1,
          accounts: 1,
        },
      },
    ])
    .toArray();
  const resultB = await client
    .db("sample_analytics")
    .collection("customers")
    .aggregate([
      {
        $match: { name: "Leslie Martinez" },
      },
      {
        $lookup: {
          from: "accounts",
          localField: "accounts",
          foreignField: "account_id",
          as: "accounts",
        },
      },
    ])
    .toArray();

  // Print the result
  console.log("Part A-Leslie Martinez's details:");
  console.log(resultA);
  console.log("Part B-Leslie Martinez's details:");
  console.log(resultB);
}

main().catch(console.error);
