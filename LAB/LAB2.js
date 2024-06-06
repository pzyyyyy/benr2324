async function main() {
  const { MongoClient } = require("mongodb");
  const uri =
    "mongodb+srv://b022210255:12345abc@cluster0.wge1mil.mongodb.net/sample_analytics?retryWrites=true&w=majority";
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log("Connected successfully to Mongobd server");
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
  for (let dbInfo of databasesList.databases) {
    console.log(` - ${dbInfo.name}`);
    // If the database is "sample_analytics", list its collections
    if (dbInfo.name === "sample_analytics") {
      const db = client.db(dbInfo.name);
      const collections = await db.listCollections().toArray();
      console.log("   collections:");
      collections.forEach((col) => {
        console.log(`   - ${col.name}`);
      });
    }
  }
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
