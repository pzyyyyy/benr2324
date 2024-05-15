async function main() {
  const { MongoClient } = require("mongodb");

  // Connection URI. Update <username>, <password>, and <your-cluster-url> to reflect your cluster.
  const uri =
    "mongodb+srv://b022210255:12345abc@cluster0.wge1mil.mongodb.net/sample_analytics?retryWrites=true&w=majority";
  const client = new MongoClient(uri);

  try {
    // Connect to the MongoDB cluster
    await client.connect();

    // Make the appropriate DB calls
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
  // Fetch the list of databases in the cluster
  const databasesList = await client.db().admin().listDatabases();

  console.log("Databases:");
  databasesList.databases.forEach((db) => {
    console.log(` - ${db.name}`);
  });
}

async function findLeslieMartinez(client) {
  // Get reference to the sample_analytics database
  const database = client.db("sample_analytics");

  // Get reference to the customers collection
  const collection = database.collection("customers");

  // Aggregation pipeline to find Leslie Martinez and project required fields
  const pipeline = [
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
  ];

  // Execute the aggregation pipeline
  const result = await collection.aggregate(pipeline).toArray();

  // Print the result
  console.log("Leslie Martinez's details:");
  console.log(result);
}

main().catch(console.error);
