import express from "express";
import cors from "cors";
import dayjs from "dayjs";
import dontenv from "dotenv";
import joi from "joi";
import { MongoClient } from "mongodb";

const server = express();

server.use(cors());
server.use(express.json());
dontenv.config();

let db = null;

const mongoClient = new MongoClient(process.env.MONGO_URI);
const promise = mongoClient.connect().then(() => {
    db = mongoClient.db(process.env.MONGO_DATABASE_NAME);
  });
  
  promise.catch(err => {
    console.log("Deu pau ao conectar o banco de dados!!!!");
  });

server.post("/participants", async (req,res) => {
    const user = req.body;

    const validation = userSchema.validate(user);
    if(validation.error) {
        return res.status(422).send("Name deve ser string não vazio");
    }

    try{
        const userVerify = await db
        .collection("users")
        .findOne({ name: user.name });

        if(userVerify) {
            return res.status(409).send("Name já utilizado");
        }

        await db
        .collection("users")
        .insertOne({ name: user.name, lastStatus: Date.now() });
        res.sendStatus(201);

        await db
        .collection("messages")
        .insertOne({ from: user.name, to: "Todos", text: "Entra na sala...", type: "status", time: dayjs().format("HH:MM:ss") });
        console.log("Cheguei")
        
    }

    catch(error) {
        console.log(error);
        res.send("Não foi possível cadastrar")
    }
})

server.get("/participants", async (req,res) => {
    try{
        const participants = await db.collection("users").find().toArray()
        res.send(participants);
    }

    catch(error){
        console.log(error)
        res.send("Não foi possível pegar a lista de participantes");
    }
})

server.post("/messages", async (req, res) => {
    const message = req.body;
    const { user } = req.headers;

    const validation = messageSchema.validate(message, {abortEarly: false});
    if(validation.error) {
        return res.status(422).send(error);
    }

    try{
        const userVerify = await db
        .collection("users")
        .findOne({ name: user.name });

        if(userVerify) {
            return res.status(422).send("Usuário não existe");
        }

        const { to, text, type } = message;

        await db
        .collection("messages")
        .insertOne({
            to,
            text,
            type,
            from: user,
            time: dayjs().format("HH:mm:ss")
        });

        res.sendStatus(201);
    }

    catch(error) {
        console.log(error)
        res.send("Não foi possível enviar a menssagem")

    };
})

server.get("/messages", async (req,res) => {
    const limit = parseInt(req.query.limit);
    const { user } = req.headers;

    try {
        const messages = await db.collection("messages").find().toArray();

        const yourMessages = messages.filter(message => {
            const { from, to, type } = message;
            const privateMessages = to === user || from === user;
            const publicMessages = type === "message";

            return privateMessages || publicMessages;
    });

    if (limit && limit !== NaN) {
      return res.send(yourMessages.slice(-limit));
    }

    res.send(yourMessages);
  }

  catch (error) {
    console.log(error);
    res.send("Não foi possível ver as mensagens");
  }
});


/*SCHEMAS (Validações JOI)*/
const userSchema = joi.object({
    name: joi.string().required()
});

const messageSchema = joi.object({
    to: joi.string().required(),
    text: joi.string().required(),
    type: joi.string().valid("message", "private_message")
});

server.listen(process.env.PORT || 5000, () => console.log("Listen on 5000"));
