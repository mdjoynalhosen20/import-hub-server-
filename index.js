require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
        const exportsCollection = database.collection("Exports"); 
        const importsCollection = database.collection("imports")

        app.post("/register", async (req, res) => {
            const data = req.body; 
            const ifExist = await usersCollection.findOne({ email: data.email }); 
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
        }); 

        app.put("/register", async (req, res) => {
            const data = req.body; 
            // console.log(data)
            const query = { email: data.email }
            const ifExist = await usersCollection.findOne(query); 
            if(ifExist) {
                const update = { $set: { lastSignInTime: data.lastSignInTime, lastLoginAt: data.lastLoginAt }}
                await usersCollection.updateOne(query, update)
                return res.send({
                    success: true, 
                    message: "You have successfully Register", 
                })
            } else {
                const result = await usersCollection.insertOne(data); 
                return res.status(201).send({
                    success: true, 
                    message:" You have successfully login", 
                    data: result
                })
            }
        })
        
        // Export related CRUD 

        app.get('/allProducts', async (req, res) => {
            const result = await exportsCollection.find().toArray();
            return res.send(result)
        }); 

        app.get('/productDetails/:id', async (req, res) => {
            try {
                const { id } = req.params;
                if (!id) {
                    return res.status(400).send({ error: 'Missing id parameter' });
                }
                const query = { _id: new ObjectId(id) };
                const result = await exportsCollection.findOne(query);

                if (!result) {
                    return res.status(404).send({ error: 'Product not found' });
                }

                res.send(result);
            } catch (error) {
                console.error(error);
                res.status(500).send({ error: 'Server error' });
            }
        });

        
        app.get('/myExports', async (req, res) => {
            const exporter = req.query; 
            const query = { exporter : exporter?.email}; 
            // const query = { exporter: "soponislam132s@gmail.com" };
            const result = await exportsCollection.find(query).toArray(); 
            // console.log(result);
            return res.send(result)
        })
        
        app.post('/addExport', async (req, res) => {
            const exportsData = req.body; 
            const createdAt = new Date().getTime(); 
            const dataToInsert = {...exportsData, createdAt}
            // console.log(dataToInsert);
            const result = await exportsCollection.insertOne(dataToInsert)
            return res.status(201).send({
                success: true, 
                message: "Exports Successfull!", 
                data: result
            })
        })

        app.get('/imports', async(req, res) => {
            const { email } = req.query; 
            const query = {importerEmail: email}; 
            const result = await importsCollection.find(query).toArray(); 
            res.send(result)
        })

        app.post('/imports', async (req, res) => {
            const data = req.body; 
            const productId = data.productId; 
            const importerEmail = data.importerEmail 
            const filter = { productId, importerEmail }
            const exist = await importsCollection.findOne(filter); 
            if(exist){ 
                const udateDocument = { 
                    $inc: { quantity: -quantity },
                }; 
                const result = await exportsCollection.updateOne({_id: new ObjectId(productId)}, udateDocument)
               return res.send({
                    success: true, 
                    message: "You have successfuly import a prodct ",
                    data: result
                })
            }

            const result = await importsCollection.insertOne(data); 
            
            return res.send({
                success: true,
                message: "You have successfuly import a prodct ",
                data: result
            })
        }); 
        
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
