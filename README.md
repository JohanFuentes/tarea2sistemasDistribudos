
### Descripción del sistema

Sistema desarrollado en JavaScript, el cual nos permite gestionar los procesos internos del gremio sopaipillero de Chile a traves de Apache Kafka, la cual es una plataforma distribuida de transmisión de datos que permite publicar, almacenar y procesar flujos de registros, así como suscribirse a ellos, de forma inmediata. Está diseñada para administrar los flujos de datos de varias fuentes y distribuirlos a diversos usuarios.

La arquitectura del Sistema se pueden resumir en la siguiente imagen:

![Img](images/arq.png)

### Enlace del vídeo del funcionamiento del Sistema

[[video](images/vimeo.png)](https://player.vimeo.com/video/765446652?h=408acc6a86&amp;badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479)

En este repositorio tendremos el codigo y las instrucciones para ejecutar la tarea 2 de sistemas distribuidos, esta consiste en implementar un servicio api rest utilizando apache kafka como sistema de streaming de eventos, para efectos de nuestro proyecto utilizaremos nodejs y docker para lograr los objetivos.

## Dependencias

- [nodejs](https://nodejs.org/es/download/package-manager/)
- [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
- [zookeeper](https://zookeeper.apache.org/releases.html)
- [kafka](https://kafka.apache.org/downloads)
- [docker](https://docs.docker.com/engine/install/)
- [docker-compose](https://docs.docker.com/compose/install/)
- [zookeeper (docker)](https://hub.docker.com/r/bitnami/zookeeper)
- [kafka (docker)](https://hub.docker.com/r/bitnami/kafka)


## Ejecutar

Ejecutamos con

```sh
    docker-compose up -d --build # Se recomienda quitar el tag -d para ver los logs y el --build si no se desea rebuilder.
```

## Topics

Para crear los topic de forma manual usar el siguiente comando:

```sh
docker-compose exec kafka /opt/bitnami/kafka/bin/kafka-topics.sh --create --bootstrap-server localhost:9092 --replication-factor 1 --partitions 1 --config retention.ms=259200000 --topic auth
```

Para verificar que este creado usar:

```sh
docker-compose exec kafka /opt/bitnami/kafka/bin/kafka-topics.sh --bootstrap-server localhost:9092 --list
```

## Rutas Post

### :3000/RegistroMiembro
Metodo http que ingresa una orden de agregar a un miembro, recibe un body:

Ejemplo:

```json
{
    "nombre":"juan", 
    "apellido":"valdes",
    "rut":"92345678-9",
    "correo":"juan@juan",
    "patente":"2",
    "premium": false
}
```
Si el usuario es premium se envia por la particion 1 del topic "ingreso", si no es premium se ingresa por la particion 0 del topic "ingreso". Si es premium el proceso de validarlo y registrarlo es mas rapido. Cabe destacar que si un miembro quiere registrar un carro que ya fue registrado, la peticion sera rechazada.

### :3000/RegistroVenta
Metodo http que ingresa una venta, recibe un body:

Ejemplo:

```json
{   
    "patente":"2",
    "cliente":"Juan", 
    "cantidad_sopaipillas":"2",
    "stock_restante":"2",
    "coordenadas":"2,0,1" 
}
```
Este registro de venta se envia a los topic:
1. ventas: el cual crea estadisticas "una vez al dia", con estos registros. Los datos se envian de manera balanciada a ambas particiones del topic (0 y 1), de manera de balancear cargas, esto se hace a traves del metodo Round Robin.
2. stock: el cual analiza el stock de cada carro, bajo 2 condiciones se mandan alertas, la primera es si el stock esta por debajo de cierta cantidad o si las ventas que haga son mayores a 5. Los datos se envian de manera balanciada a ambas particiones del topic (0 y 1), de manera de balancear cargas, esto se hace a traves del metodo Round Robin.
3. avisos: el cual analiza la posicion de cada carro (coordenadas enviadas a traves de una venta) y la muestra por pantalla, en el caso de que un carro no envie sus coordenadas dentro de un minuto, ya no se imprimiran mas sus coordenadas por pantalla. Los datos son enviados a la particion 0 del topic, por esta particion se envian las coordenadas de los carritos que NO estan fugados.

Cabe mencionar que el atributo "hora", se manda automaticamente en tiempo real, al realizar la peticion post.

### :3000/AvisoAgenteExt
Metodo http que ingresa la patente y coordenadas de un carrito en fuga, recibe un body:

Ejemplo:

```json
{   
    "patente":"1",
    "coordenadas":"2,2,7" 
}
```
Estos datos se envian al topic "avisos", a la particion 1 del topic. A traves de esta particion se alerta la presencia de un carrito en fuga, esta alerta se muestra por pantalla, mostrando la petente y coordenadas del carrito. 

## Rutas Get

### :5002/ingresoNuevosMiembros

### :5001/ventas
### :5004/stock
### :5003/posicionCarritos

Metodo http post que ingresa una orden, recibe un body:

Ejemplo:

```json
{
	"user": "nicolas.hidalgoc@mail.udp.cl",
	"password": "abcdefg"
}
```

Devuelve estado 200 y data agregada de estar correcto.

### :5000/blocked

Metodo http get que genera el resumen de usuarios bloqueados, devuelve estado 200 de estar correcto y un json.

Ejemplo:

```json
{
	"users-blocked": [
		"nicolas.hidalgoc@mail.udp.cl",
        "nicolas.nunez2@mail.udp.cl"
	]
}
```
