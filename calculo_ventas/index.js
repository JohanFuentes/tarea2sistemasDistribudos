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

function estadisticas(registro,resultados,carros){

    registro.forEach( (value, key, map) => {

        var contadorVentas = 0;
        var clientes = new Set();
        var cantidad = 0;
        var aux = new Array;
        
        var ventasTotales = 0;
        var promedioVentas = 0;
        var clientesTotales = 0;
        
            value.forEach(function(data) {
                contadorVentas = contadorVentas + 1;
                clientes.add(data.cliente);
                cantidad = cantidad + parseInt(data.cantidad_sopaipillas);
            });
        ventasTotales = contadorVentas;
        clientesTotales = clientes.size;
        promedioVentas = cantidad/clientesTotales;
        
        aux.push(ventasTotales);
        aux.push(clientesTotales);
        aux.push(promedioVentas);
        resultados.set(key,aux);
          });
    

        resultados.forEach( (value, key, map) => {

            console.log("carro : ",key);
            var aux = resultados.get(key);
            console.log("ventas totales : ",aux[0]);
            console.log("clientes totales : ",aux[1]);
            console.log("promedio de ventas : ",aux[2]);

              });
        
        carros.clear();
        registro.clear();
        resultados.clear();

}

/*
await producer.connect();
await producer.send({
    topic: 'ingreso',            //Ingreso Nuevos Miembros
    messages: [{value: JSON.stringify(req.body)}]
})
*/

//var white_list = new Map();
var lista_ventas = [];
//var ventasTotales = 0;
//var promedioVentas = 0;
//var clientesTotales = 0;
const carros = new Set();
//const clientes = new Set();
var registro = new Map();
var resultados = new Map();


const ventas = async () => {
    const consumer = kafka.consumer({ groupId: 'ventas', fromBeginning: true });
    await consumer.connect();
    await consumer.subscribe({ topic: 'ventas' });
    await consumer.run({
        partitionsConsumedConcurrently: 2,
        eachMessage: async ({ topic, partition, message }) => {

            var particion = JSON.parse(partition);

            if (message.value){
                if(particion==0){
                    console.log("Particion:",particion,"(balanceo de cargas)");
                }else if(particion==1){
                    console.log("Particion:",particion,"(balanceo de cargas)");
                }
                var data = JSON.parse(message.value.toString());
                //lista_ventas.push(data);
                if(!carros.has(data.patente)){
                    var aux = new Array;
                    aux.push(data);
                    carros.add(data.patente);
                    registro.set(data.patente,aux);
                }else{
                    var aux = registro.get(data.patente);
                    aux.push(data);
                    registro.set(data.patente,aux);
                }

                display = setInterval(estadisticas, 60000, registro, resultados, carros);
                //console.log(data);
                
            }
        },
      })
}

//console.log("!registro!",registro);



app.get("/ventas", async (req, res) => {
    /*
    registro.forEach( (value, key, map) => {

        var contadorVentas = 0;
        var clientes = new Set();
        var cantidad = 0;
        var aux = new Array;
        
        var ventasTotales = 0;
        var promedioVentas = 0;
        var clientesTotales = 0;
        
            value.forEach(function(data) {
                contadorVentas = contadorVentas + 1;
                clientes.add(data.cliente);
                cantidad = cantidad + parseInt(data.cantidad_sopaipillas);
            });
        ventasTotales = contadorVentas;
        clientesTotales = clientes.size;
        promedioVentas = cantidad/clientesTotales;
        
        aux.push(ventasTotales);
        aux.push(clientesTotales);
        aux.push(promedioVentas);
        resultados.set(key,aux);
          });
    

        resultados.forEach( (value, key, map) => {

            console.log("carro : ",key);
            var aux = resultados.get(key);
            console.log("ventas totales : ",aux[0]);
            console.log("clientes totales : ",aux[1]);
            console.log("promedio de ventas : ",aux[2]);

              });
        
        carros.clear();
        registro.clear();
        resultados.clear();
    //console.log('Registro///',registro);
    //console.log('Resultados///',resultados);
    */
    res.status(200).json({"Estadisticas": 'función ejecutada'});
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
    ventas();
});