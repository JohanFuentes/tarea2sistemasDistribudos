const express = require("express");
const cors = require("cors");
const { Kafka } = require('kafkajs')

const port = process.env.PORT;
const app = express();

app.use(cors());
app.use(express.json());

const kafka = new Kafka({
    brokers: [process.env.kafkaHost]
});


/*
await producer.connect();
await producer.send({
    topic: 'ingreso',            //Ingreso Nuevos Miembros
    messages: [{value: JSON.stringify(req.body)}]
})
*/

var white_list = new Map();
var lista_nuevos_miembros = [];


const ingreso = async () => {
    const consumer = kafka.consumer({ groupId: 'ingreso', fromBeginning: true });
    await consumer.connect();
    await consumer.subscribe({ topic: 'ingreso' });
    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            if (message.value){
                var data = JSON.parse(message.value.toString());
                lista_nuevos_miembros.push(data);
            }
        },
      })
}

app.get("/ingresoNuevosMiembros", async (req, res) => {
    res.status(200).json({"nuevos_miembros": lista_nuevos_miembros});
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
    ingreso();
});