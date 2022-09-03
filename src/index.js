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

const db = new MongoClient(process.env.MONGO_URI);

server.post("/participantes", async (req,res) => {
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

        await db
        .collection("messages")
        .insertOne({ from: user.name, to: "Todos", text: "Entra na sala...", type: "status", time: dayjs().format("HH:MM:SS") });
        
    }

    catch(error) {

    }
})


/*SCHEMAS (Validações JOI)*/
const userSchema = joi.object({
    name: joi.string().required()
});

const messageSchema = joi.object({
    to: joi.string().required(),
    text: joi.string().required(),
    type: joi.string().valid("message", "private_message")
});

server.listen(PORT || 5000, () => console.log("Listen on 5000"));
