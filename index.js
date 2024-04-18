const express = require('express')
const app = express()
const port = process.env.PORT || 3000;
const bcrypt =require('bcrypt');

app.use(express.json())

//1)new user registration
app.post('/user',async(req, res)=>{
    
  const hash =bcrypt.hashSync(req.body.password,10);

    //insetOne
    let result= await client.db('BERR2243').collection('student').insertOne(
      {
        username: req.body.username,
        password: hash,      //all infos one from body
        name: req.body.name,
        email:req.body.email  
    })
    res.send(result)
    })
app.post('/login',async(req, res)=>{
      //username: req.body.username         //data of user shound keyin
      //password: req.body.password

      //Step1: Check user name if exist
      let result=await client.db("BERR2243").collection("student").findOne(
        {username: req.body.username    //pwd alrdy hash
      })

    if(!result) {res.send("Username not found")}
    else{
      //Step2: Check if password is correct
      if(bcrypt.compareSync(req.body.password,result.password)==true){
        res.send("Login success")
      }else{
        res.send("Wrong password")
      }
    }
    console.log (result)
  }
)


//get user profile
app.get('/user/:name', async(req, res) => {
  let result = await client.db('BERR2243').collection('student').findOne({ 
   name:req.params.name   //name:new ObjectId(req.params.name) ZHAO DOC BY USING ID HAOMA
  })                      //params jia 'name' as endpoint
 
  res.send(result)
})

//patch(update) user profile
app.patch('/user/:name', async(req, res) => {
  let result = await client.db('BERR2243').collection('student').updateOne(
    {_id:new ObjectId(req.params.name)},
    {$set:{name:req.body.name}
  })
  res.send(result)
})

//delete user profile
app.delete('/user/:name', async(req, res) => {
  let result = await client.db('BERR2243').collection('student').deleteOne()
    res.send(result)
  
})


app.listen(port, () => {
   console.log(`Example app listening on port ${port}`)
})
app.get('/') 


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

  } finally {
    // Ensures that the client will close when you finish/error
    ////await client.close();
  }
}
run().catch(console.dir);

