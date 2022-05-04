// >> Consigna: Incorporar al proyecto de servidor de trabajo la compresión gzip.
// Verificar sobre la ruta /info con y sin compresión, la diferencia 
// de cantidad de bytes devueltos en un caso y otro.
// Luego implementar loggueo (con alguna librería vista en clase) que registre 
// lo siguiente:
// - Ruta y método de todas las peticiones recibidas por el servidor (info)
// - Ruta y método de las peticiones a rutas inexistentes en el servidor (warning)
// - Errores lanzados por las apis de mensajes y productos, únicamente (error)

// Considerar el siguiente criterio:

// - Loggear todos los niveles a consola (info, warning y error)
// - Registrar sólo los logs de warning a un archivo llamada warn.log
// - Enviar sólo los logs de error a un archivo llamada error.log

// >> Consigna: Luego, realizar el análisis completo de performance del servidor 
// con el que venimos trabajando.
// Vamos a trabajar sobre la ruta '/info', en modo fork, agregando ó extrayendo 
// un console.log de la información colectada antes de devolverla al cliente. 
// Además desactivaremos el child_process de la ruta '/randoms'
// Para ambas condiciones (con o sin console.log) en la ruta '/info' OBTENER:

// 1) El perfilamiento del servidor, realizando el test con --prof de node.js. 
// Analizar los resultados obtenidos luego de procesarlos con --prof-process. 
// Utilizaremos como test de carga Artillery en línea de comandos, emulando 50 
// conexiones concurrentes con 20 request por cada una. Extraer un reporte con 
// los resultados en archivo de texto.

// >> Consigna:
// Luego utilizaremos Autocannon en línea de comandos, emulando 100 conexiones 
// concurrentes realizadas en un tiempo de 20 segundos. Extraer un reporte con 
// los resultados (puede ser un print screen de la consola)
// 2) El perfilamiento del servidor con el modo inspector de node.js --inspect. 
//   Revisar el tiempo de los procesos menos performantes sobre el archivo fuente de inspección.
// 3) El diagrama de flama con 0x, emulando la carga con Autocannon con los mismos parámetros 
// anteriores.
// Realizar un informe en formato pdf sobre las pruebas realizadas incluyendo los resultados de 
// todos los test (texto e imágenes). 
// 👉 Al final incluir la conclusión obtenida a partir del análisis de los datos.


(async()=>{
let express = require("express");
let app = express();
let server = require("http").Server(app);
let io = require("socket.io")(server);
const {engine} = require ("express-handlebars")
const path = require("path")
const mongoose = require('mongoose')
const MongoStore = require('connect-mongo')
const cookieParser = require('cookie-parser')
const session = require('express-session')
const Filestore = require('session-file-store')(session)
const passport = require('passport')
const flash = require('express-flash')
const initializePassport = require('./Passport/local')
const prodMethod = require('./models/productos')
const msgMethod = require('./models/mensajes')
const { HOSTNAME, SCHEMA, DATABASE, USER, PASSWORD, OPTIONS } = require("./DBconfig/Mongo")
const homeRouter = require('./routes/routes')
const yargs = require('yargs/yargs') (process.argv.slice(2))
const cluster = require('cluster')
const compression = require('compression')
const logger = require("./Logs/winston")
const numCPUs = require ('os').cpus().length
require('dotenv').config({
  path: path.resolve(__dirname, '.env')
})

const iniciarMain=()=>{
  
  
  mongoose.connect(`${process.env.SCHEMA}://${process.env.USER}:${process.env.PASSWORD}@${process.env.HOSTNAME}/${process.env.DATABASE}?${process.env.OPTIONS}`).then(()=>{
    console.log("Conectado con base de datos MongoDB")
  })
  
  let messagePool=[]
  let productList=[]
  
  initializePassport(passport)
  
  app.use("/static/", express.static(path.join(__dirname, "public")))
  
  app.use(express.json())
  app.use(express.urlencoded({extended:true}))

  app.use(compression())
  
  app.use(flash())
    app.use(cookieParser("Esto es un secreto"))
    app.use(session({
      secret:"secret",
      resave: true,
      saveUninitialized:true,
      
      store:new MongoStore({
        mongoUrl: `${process.env.SCHEMA}://${process.env.USER}:${process.env.PASSWORD}@${process.env.HOSTNAME}/${process.env.DATABASE}?${process.env.OPTIONS}`,
        expires: 60,
        createdAt: new Date(),
        autoRemove: 'native',
        autoRemoveInterval: 1,
        ttl: 60, 
        autoRemove: true,
        delete: true
      })
    }))

    app.use(passport.initialize())
    app.use(passport.session())


    app.set('view engine', 'hbs')
      
    app.engine('hbs',engine({
      layoutsDir: path.join(__dirname,'/views'),
      extname: 'hbs',
      defaultLayout:''
    }))
    
    app.use('/', homeRouter)

    // iniciamos la conexión del socket
    io.on("connection", async function (socket) {   //Mensaje que indica una conexión. 
      console.log("Un cliente se ha conectado")

      messagePool = await msgMethod.cargarMensajes()
      productList = await prodMethod.cargarProductos()

      socket.emit("messages", messagePool)

      prodMethod.cargarProductos().then((listaProductos)=>{
        socket.emit('server:productList', listaProductos)
      })

      socket.on('new-message', async (data)=>{  // Mensaje que indica un nuevo mensaje de chat recibido
          msgMethod.appendMessage(data)  // Almacenar mensaje en la base de datos
          messagePool = await msgMethod.cargarMensajes()
          io.sockets.emit("messages", messagePool)
        })
        
        socket.on('new-product', (prodInfo)=>{ //Mensaje que indica un nuevo producto agregado al stock de productos
          prodInfo.precio = JSON.parse(prodInfo.precio)
          prodMethod.agregarProducto(prodInfo) // Almacenar nuevo producto en la base de datos
          
          //Desnormalización de datos de product
          
          prodMethod.cargarProductos().then((listaProductos)=>{
            
            productList = prodMethod.data
            console.log('main.js-> mensaje new-product: ' + listaProductos)
            
            io.sockets.emit('server:productList', listaProductos)
          })
        })    
        
      })
      
      server.listen(args.PORT, function () {
        console.log(`Servidor corriendo en http://localhost:${args.PORT}`)
        //logger.info(`Application has started with pid: ${process.pid}`)
        //logger.error(`Servidor corriendo en http://localhost:${args.PORT}`)
      })
    }
    
      
      const args = yargs.default({ PORT: 8080, mode:'fork'}).argv
  
      console.log(`PORT: ${args.PORT} -- MODE: ${args.mode}`)
  
      //const PORT = process.env.PORT || 8080
  
      if(args.mode =='cluster'){   //Si el modo es Cluster...
  
        console.log('modo CLUSTER')
        if(cluster.isMaster) {    // Si el proceso es padre...
          for(let i=0; i<=numCPUs; i++){
            
            console.log ('Creando nuevo Fork')
            cluster.fork()
            
          }
          
          cluster.on('exit', (worker, code, signal)=>{
            console.log(`worker ${worker.process.id} murió`)
          })
          
          console.log (`Proceso primario ${process.pid}`)
        }   //if(mode == 'cluster')
  
        else{           // Si el proceso es hijo en modo cluster...
            iniciarMain()
        }      
      }
  
      else{
          console.log('Modo FORK')
          iniciarMain()
      }
      
})()                                                                               // O si el modo es fork...
          
