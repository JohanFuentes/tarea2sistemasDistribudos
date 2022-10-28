const express = require("express");
const cors = require("cors");
const { Kafka } = require('kafkajs')
var carrosRegistrados = new Set();
const port = process.env.PORT;
const app = express();

app.use(cors());
app.use(express.json());

const kafka = new Kafka({
    brokers: [process.env.kafkaHost]
});

const topicParticiones  = async () => {
    const admin = kafka.admin();
    await admin.connect();
    await admin.createTopics({
        topics: [
        	{ topic: 'ingreso', numPartitions: 2 },
        	{ topic: 'ventas', numPartitions: 2 },
        	{ topic: 'stock', numPartitions: 2 },
        	{ topic: 'avisos', numPartitions: 2 }
        ],
});
    await admin.disconnect();
};

topicParticiones().then(() => console.log('done'));

function sleep(ms){
    return new Promise(resolve => setTimeout(resolve, ms));
}

const producer = kafka.producer();

/*
app.post("/login", async (req, res) => {
    req.body.time = new Date().getTime();
    console.log(req.body.user, "/", req.body.pass, req.body.time);
    console.log(new Date(req.body.time).toLocaleDateString("es-CL"), new Date(req.body.time).toLocaleTimeString("es-CL"), req.body.user, "esta intentando ingresar.");
    await producer.connect();
    await producer.send({
        topic: 'auth',
        messages: [{value: JSON.stringify(req.body)}]
    })
    await producer.disconnect().then(
        res.status(200).json({
            user: req.body.user,
            pass: req.body.pass
        })
    )
});
*/
// Nombre, Apellido, Rut, Correo, Patente y premium. 

app.post("/RegistroMiembro", async (req, res) => {
    req.body.time = new Date().getTime();
    await producer.connect();

    if(!carrosRegistrados.has(req.body.patente)){

        carrosRegistrados.add(req.body.patente);
        if(req.body.premium){
            await producer.send({
                topic: 'ingreso',            //Ingreso Nuevos Miembros
                messages: [{value: JSON.stringify(req.body),partition:1}]
            })
        }else{
            await sleep(5000);
            await producer.send({
                topic: 'ingreso',            //Ingreso Nuevos Miembros
                messages: [{value: JSON.stringify(req.body),partition:0}]
            })
        }

        await producer.disconnect().then(
            res.status(200).json({
                nombre: req.body.nombre,
                patente: req.body.patente
            })
        )
    }else{
        await producer.disconnect().then(
            res.status(200).json({
                error: "carro ya se encuentra registrado"
            })
        )
    }
});

//Cliente, Cantidad de Sopaipillas, Hora, Stock_restante y coordenadas.

app.post("/RegistroVenta", async (req, res) => {

    req.body.time = new Date().getTime();
    await producer.connect();

    if(carrosRegistrados.has(req.body.patente)){
        await producer.send({
            topic: 'ventas',                                    //Registro de venta
            messages: [{value: JSON.stringify(req.body)}]
        })
        await producer.send({
            topic: 'stock',                                    //stock
            messages: [{value: JSON.stringify(req.body)}]
        })
        await producer.send({
            topic: 'avisos',                                    //stock
            messages: [{value: JSON.stringify(req.body),partition:0}]
        })
        await producer.disconnect().then(
            res.status(200).json({
                cliente: req.body.cliente,
                coordenadas: req.body.coordenadas
            })
        )
    }else{
        await producer.disconnect().then(
            res.status(200).json({
                error: "carro no registrado"
            })
        )
    }
        
    
});

//coordenadas

app.post("/AvisoAgenteExt", async (req, res) => {
    //req.body.time = new Date().getTime();
    //console.log(req.body.user, "/", req.body.pass, req.body.time);
    //console.log(new Date(req.body.time).toLocaleDateString("es-CL"), new Date(req.body.time).toLocaleTimeString("es-CL"), req.body.user, "esta intentando ingresar.");
    await producer.connect();
    if(carrosRegistrados.has(req.body.patente)){
    await producer.send({
        topic: 'avisos',                               //Avisos agentes externos
        messages: [{value: JSON.stringify(req.body),partition:1}]
    })
    await producer.disconnect().then(
        res.status(200).json({
            coordenadas: req.body.coordenadas
        })
    )
    }else{
        await producer.disconnect().then(
            res.status(200).json({
                error: "carro no registrado"
            })
        )
    }
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});