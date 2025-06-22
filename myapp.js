
const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express();
const cors = require('cors');
const { GoogleGenAI, Modality } = require('@google/genai');
const imagekit = require('./imageKit');
app.use(cors({
  origin:['https://blog-p0ssgtcmp-durjoychandos-projects.vercel.app'],
  credentials: true
}));
app.use(express.json());

// A sample route;
const uri = `mongodb+srv://${process.env.USER_DB}:${process.env.PASSWORD_DB}@cluster0.u87dt.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

//-------------------------------ImgBb ApI key --------------------------------------------------//

const Image_API_KEY = `https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`;
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
    const likeCollection = database.collection('postlikelist');
    const comment_colletion = database.collection('comments')


    //---------------------------------- API functionality Start Here ------------------------------//
    app.post('/blogPost', async (req, res) => {

      const Info = req.body;
      // if (!Info.title || !Info.description || !Info.image) {
      //   return res.status(400).send({ error: "Missing required fields" });
      // }
      const post = await postCollection.insertOne(Info);
      // console.log('blogInfo', post)
      res.send(post)
    })

    //-------------------------------------------Gemini text generate--------------------//
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
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
    //------------------------------Gemini Image Generate-----------------------------------//
    app.get('/Gemini/ImageGenerate', async (req, res) => {
      // console.log('hello world Image Generate functions');
      const ImgText = req.query.imgText;

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const contents =
        "Hi, can you create a 3d rendered image " + ImgText;

      // Set responseModalities to include "Image" so the model can generate  an image
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-preview-image-generation",
        contents: contents,
        config: {
          responseModalities: [Modality.TEXT, Modality.IMAGE],
        },
      });
      for (const part of response.candidates[0].content.parts) {
        // Based on the part type, either show the text or save the image
        if (part.text) {
          // console.log(part.text);
        } else if (part.inlineData) {

          const imageData = part.inlineData.data;
          // const buffer = Buffer.from(imageData, "base64");
          // const base64Image = buffer.toString("base64");
          const buffer = Buffer.from(imageData, 'base64');
          imagekit.upload({
            file: buffer,
            fileName: 'AI-Generate-image.png',
          },
            (err, result) => {
              if (err) {
                console.log('error', err)
                return res.status(400).send({ message: err });
              }
              else {
                console.log('success', result)
                return res.status(200).json({ 'image_url': result.url });
              }
            }
          )
        }
      }

    })

    //---------------------------------------GET ALL POST DATA--------------------------------//
    app.get('/blog/allpost', async (req, res) => {
      // const searchText = req.query.key;
      // const searching = {
      //   title: { $regex: searchText, $options: 'i' }
      // };
      const result = await postCollection.find().toArray();
      // console.log("all post:", result)
      res.send(result)
    })
    //------------------------- post like --------------------------------------//
    app.post('/blog/likepost/:id/:email', async (req, res) => {
      const { id, email } = req?.params;
      // console.log('id', id, 'user_id', email)
      const queryId = await postCollection.findOne({ _id: new ObjectId(id) });

      const IsExist = await likeCollection.findOne({ blogId: id, likerEmail: email })
      console.log("IsExist:", IsExist)
      // like -1 functionality //
      if (IsExist) {
        const updates = {
          $inc: { like: -1 }
        }
        const optional = { upsert: true }
        if (queryId?.like == 0) {
          return res.send({ message: 'sorry ! failed' })
        }
        const updateValue = await postCollection.updateOne({ _id: new ObjectId(id) }, updates, optional)
        if (updateValue) {
          const removeLikeList = await likeCollection.deleteOne({ blogId: id, likerEmail: email });
          if (removeLikeList) {
            return res.send({ message: 'unlike Sucessful' })
          }
        }
        res.send({ message: 'unlike_failed' });
      }

      // like +1 functionality //

      if (!queryId) {
        return res.send({ message: 'your post Id not available' })
      }
      const updates = {
        $inc: { like: 1 }
      }
      const optional = { upsert: true }

      const updateValue = await postCollection.updateOne({ _id: new ObjectId(id) }, updates, optional)
      if (!updateValue) {
        return res.send({ message: 'no update' })
      }
      const result = await likeCollection.insertOne({ blogId: id, likerEmail: email, date: new Date() })
      const viewCollection = await likeCollection.findOne({ blogId: id, likerEmail: email })
      if (viewCollection) {
        res.send({ message: 'like', Email: viewCollection?.likerEmail, BlogId: viewCollection?.blogId })
      }

    })

    // ------------------------comment related api---------------------------------------//
    app.post('/blog/comments/:id', async (req, res) => {
      const { id } = req.params;
      const data = req.body;
      const query = { ...data, post_id: id }
      const commentPost = await comment_colletion.insertOne(query);
      if (!commentPost) {
        return res.send({ error: 'comment post unsuccessful' })
      }
      const updates = {
        $inc: { comment: 1 }
      }
      const optional = { upsert: true };
      const updateComment = await postCollection.updateOne({ _id: new ObjectId(id) }, updates, optional)
      res.send(updateComment);
    })

    // --------------------- comment list ----------------------------------------------//
    app.get('/blog/commentlist/:id', async (req, res) => {
      const { id } = req.params;

      console.log('id:', id)
      if (!id) {
        return res.status(400).send({ error: 'id is undefined' })
      }
      const query = { _id: new ObjectId(id) };
      const query2 = { post_id: id }
      const result = await postCollection.findOne(query);
      if (!result) {
        return res.status(401).send({ info: 'unauthorize access' })
      }
      const authorImage = await comment_colletion.find(query2).toArray();

      // console.log('aggres:',{comment_list:authorImage ,post_List:result})
      res.send({ comment_list: authorImage, post_List: result })
      // res.send(result);
    })

    //------------------------------ post delete related api ---------------------------------//
    app.delete('/blog/post/delete/:id',async(req,res)=>{
      const {id}= req?.params;
      const query= {_id:new ObjectId(id)};
      const result= await postCollection.deleteOne(query);
      console.log(result);
      res.send(result)
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