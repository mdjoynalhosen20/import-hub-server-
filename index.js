require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const express = require('express')
const app = express()
const cors = require("cors")
const port = 3000

app.use(express.json());
app.use(cors({
    origin: [process.env.CLIENT_URL],
    credentials: true,
}))

app.get('/', (req, res) => {
    console.log(req.body);
    res.send('Hello World!')
}); 

const uri = process.env.DATABASE_URI;
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

        // * All Collection list are here 
        const database = client.db("ImportExport_DB"); 
        const usersCollection = database.collection("users"); 

        app.post("/register", async (req, res) => {
            const data = req.body; 
            const ifExist = await usersCollection.findOne(data.email); 
            if(ifExist){
               return res.send({
                    success: false, 
                    message: "You are already registered"
                })
            }; 

            const result = await usersCollection.insertOne(data); 
            
            return res.send({
                success: true, 
                message: "you have Successfully registered", 
                data: result
            })
        })
        
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        await client.close();
    }
}
run().catch(console.dir);

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
