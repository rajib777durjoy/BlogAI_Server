
const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config()
const app = express();
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');


// app.use(cors({
//     origin:['http://localhost:3000'],
//     credentials: true
// }));
app.use(cors())
app.use(express.json());

// A sample route;
const uri = `mongodb+srv://${process.env.userDB}:${process.env.PasswordDb}@cluster0.u87dt.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    // await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");

    //--------------------Database Collection-------------------------------------------------//
    const database = client.db('Blog_Platform');
    const postCollection = database.collection('post_list');


    //---------------------------------- API functionality Start Here ------------------------------//
    app.post('/blogPost/:user_id', async (req, res) => {
      const userId = req.params?.user_id;
      const Info = req.body;
      if (!Info.title || !Info.description || !Info.image) {
        return res.status(400).send({ error: "Missing required fields" });
      }
      const post = await postCollection.insertOne(Info);
      console.log('blogInfo', post)
      res.send(post)
    })

    //-------------------------------------------Gemini text generate--------------------//
    const ai = new GoogleGenAI({ apiKey: process.env.Gemini_API_KEY });
    //  console.log(ai)
    app.get('/Gemini/textGenarate', async (req, res) => {
      const text = req?.query?.text;
      const textGenarate = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: text,
      });
      const cleanText = (textGenarate.text)
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .trim();
      res.send({ result: cleanText })
    })

  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);
app.get('/', (req, res) => {
  res.send('Server is running!');
});



module.exports = app;