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
var lista_stock = [];

const stock = async () => {
    const consumer = kafka.consumer({ groupId: 'stock', fromBeginning: true });
    await consumer.connect();
    await consumer.subscribe({ topic: 'stock' });
    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            if (message.value){
                var data = JSON.parse(message.value.toString());
                lista_stock.push(data.stock_restante);
            }
        },
      })
}


app.get("/stock", async (req, res) => {
    res.status(200).json({"lista_stock": lista_stock});
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
    stock();
});