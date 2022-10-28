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
        partitionsConsumedConcurrently: 2,
        eachMessage: async ({ topic, partition, message }) => {
            var particion = JSON.parse(partition);

            if (message.value){
                var data = JSON.parse(message.value.toString());
                lista_nuevos_miembros.push(data);
                if(particion==0){
                    var tiempoActual = new Date().getTime();
                    var diff = tiempoActual - data.time;
                    console.log("Particion:",particion,"(miembro normal)");
                    console.log("Nuevo registro de un miembro normal, tiempo en ser registrado:",diff/1000,"segundos.");
                }else if(particion==1){
                    var tiempoActual = new Date().getTime();
                    var diff = tiempoActual - data.time;
                    console.log("Particion:",particion,"(miembro premium)");
                    console.log("Nuevo registro de un miembro premium, tiempo en ser registrado:",diff/1000,"segundos.");
                }
                
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