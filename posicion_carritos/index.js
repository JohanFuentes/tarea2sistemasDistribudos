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
var lista_posicion_carritos = [];

const avisos = async () => {
    const consumer = kafka.consumer({ groupId: 'avisos', fromBeginning: true });
    await consumer.connect();
    await consumer.subscribe({ topic: 'avisos' });
    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            if (message.value){
                var data = JSON.parse(message.value.toString());
                lista_posicion_carritos.push(data);
            }
        },
      })
}


app.get("/posicionCarritos", async (req, res) => {
    res.status(200).json({"coordenadas": lista_posicion_carritos});
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
    avisos();
});