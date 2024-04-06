const express = require('express')
const app = express()
const port = process.env.PORT || 3000;

app.use(express.json())

//Add express server.method({endpoint})
//1)new user registration
app.post('/userRegistre',(req,res)=>{
    //insetOne
    console.log('new user registration')
})

//2)get user profile
app.get('/userReadAcc', (req, res) => {
   //fineOne
   //console.log('get user profile')   
   console.log(req) 

})

//3)update user profile
app.patch('/userUpdatAcc', (req, res) => {
   //updateOne
    console.log('update user profile')
})

//4)delete user profile
app.delete('/userDeleteAcc', (req, res) => {
   //deleteOne
    console.log('delete user profile')
})
app.get('/') 


app.listen(port, () => {
   console.log(`Example app listening on port ${port}`)
})

//Path:package.json
const { MongoClient, ServerApiVersion,ObjectId } = require('mongodb');
const uri = "mongodb+srv://soklywn2612:Asdfghjkl2326@cluster0.isqzhdd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    console.log('Connected successfully to Mongobd server');

    ///insert a document to user collection
    /*let result=await client.db('BERR2243').collection('student').insertOne(
      {name:'wong',
      age: 22,
    })*/

    ///Read a documents from user collection
    /*let result=await client.db('BERR2243').collection('student').find(
      {name:'wong'}).toArray();*/
    
    ///update a document in user collection
    /*let result=await client.db('BERR2243').collection('student').updateOne(
      {_id: new ObjectID('6605100f439c06190d5fd3de')},
      {$set:{name:'ME',
        age:25}}
    )*/

    ///delete a document in user collection
    /*let result=await client.db('BERR2243').collection('student').deleteOne(
      {_id: new ObjectId('6605100f439c06190d5fd3de')})
      */

    console.log(result)

    ////await client.db("admin").command({ ping: 1 });
    ////console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    ////await client.close();
  }
}
run().catch(console.dir);

