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

const topicParticiones  = async () => {
    const admin = kafka.admin();
    await admin.connect();
    await admin.createTopics({
        topics: [
        	{ topic: 'nuevosMiembros', numPartitions: 2 },
        	{ topic: 'ventas', numPartitions: 2 },
        	{ topic: 'stock', numPartitions: 2 },
        	{ topic: 'coordenadas', numPartitions: 2 }
        ],
});
    await admin.disconnect();
};

topicParticiones().then(() => console.log('done'));

const producer = kafka.producer();

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

// Nombre, Apellido, Rut, Correo, Patente y premium. 

app.post("/RegistroMiembro", async (req, res) => {
    //req.body.time = new Date().getTime();
    //console.log(req.body.user, "/", req.body.pass, req.body.time);
    //console.log(new Date(req.body.time).toLocaleDateString("es-CL"), new Date(req.body.time).toLocaleTimeString("es-CL"), req.body.user, "esta intentando ingresar.");
    await producer.connect();
    if (req.body.premium == true) {
    	await producer.send({
        	topic: 'nuevosMiembros',            //Ingreso Nuevos Miembros Premium
        	messages: [{key: 'ingresoUno', value: JSON.stringify(req.body), partition: 0}]
    	})
    } else {
    	await producer.send({
        	topic: 'nuevosMiembros',            //Ingreso Nuevos Miembros NO Premium
        	messages: [{key: 'ingresoDos', value: JSON.stringify(req.body), partition: 1}]
    	})
    }
    await producer.disconnect().then(
        res.status(200).json({
            nombre: req.body.nombre,
            patente: req.body.patente
        })
    )
});

//Cliente, Cantidad de Sopaipillas, Hora, Stock_restante y coordenadas.

app.post("/RegistroVenta", async (req, res) => {
    //req.body.time = new Date().getTime();
    //console.log(req.body.user, "/", req.body.pass, req.body.time);
    //console.log(new Date(req.body.time).toLocaleDateString("es-CL"), new Date(req.body.time).toLocaleTimeString("es-CL"), req.body.user, "esta intentando ingresar.");
    await producer.connect();
    await producer.send({
        topic: 'ventas',                                    //Registro de venta
        messages: [{value: JSON.stringify(req.body)}]
    })
    await producer.send({
        topic: 'stock',                                    //stock
        messages: [{value: JSON.stringify(req.body)}]
    })
    await producer.send({
        topic: 'coordenadas',                               //Registro de ubicación carrito
        messages: [{key: 'coordenadasUno', value: JSON.stringify(req.body), partition: 0}]
    })
    await producer.disconnect().then(
        res.status(200).json({
            cliente: req.body.cliente,
            coordenadas: req.body.coordenadas
        })
    )
});

//coordenadas

app.post("/AvisoAgenteExt", async (req, res) => {
    //req.body.time = new Date().getTime();
    //console.log(req.body.user, "/", req.body.pass, req.body.time);
    //console.log(new Date(req.body.time).toLocaleDateString("es-CL"), new Date(req.body.time).toLocaleTimeString("es-CL"), req.body.user, "esta intentando ingresar.");
    await producer.connect();
    await producer.send({
        topic: 'coordenadas',                               //Avisos agentes externos, carrito prófugo
        messages: [{{key: 'coordenadasDos', value: JSON.stringify(req.body), partition: 1}}]
    })
    await producer.disconnect().then(
        res.status(200).json({
            coordenadas: req.body.coordenadas
        })
    )
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});
