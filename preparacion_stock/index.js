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

var carro = new Set();
var cantidad = new Map();
var lista_stock = new Array;
var stock = 50;

const stock = async () => {
    const consumer = kafka.consumer({ groupId: 'stock', fromBeginning: true });
    await consumer.connect();
    await consumer.subscribe({ topic: 'stock' });
    await consumer.run({
        partitionsConsumedConcurrently: 2,
        eachMessage: async ({ topic, partition, message }) => {
            var particion = JSON.parse(partition);
            if(message.value){
                if(particion==0){
                    console.log("Particion:",particion,"(balanceo de cargas)");
                }else if(particion==1){
                    console.log("Particion:",particion,"(balanceo de cargas)");
                }
                var data = JSON.parse(message.value.toString());

                if(carro.has(data.patente)){
                    var count = cantidad.get(data.patente);
                    count = count + 1;
                    cantidad.set(data.patente,count);
                    if(count==5 || data.stock_restante<10){
                        console.log('Carro ',data.patente,"necesita reponer Stock!");
                        cantidad.set(data.patente,0);
                    }
                }else{
                    var count = 1;
                    carro.add(data.patente);
                    cantidad.set(data.patente,count);
                }
            }
            },
        })
  }


app.get("/stock", async (req, res) => {
    res.status(200).json({"Stock": "función ejecutandose"});
});


app.listen(port, () => {
    console.log(`Listening on port ${port}`);
    stock();
});