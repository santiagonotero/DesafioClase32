// Tomando con base el proyecto que vamos realizando, agregar un parámetro más en la ruta de comando 
// que permita ejecutar al servidor en modo fork o cluster. Dicho parámetro será 'FORK' en el primer 
// caso y 'CLUSTER' en el segundo, y de no pasarlo, el servidor iniciará en modo fork.
//   HECHO ---> - Agregar en la vista info, el número de procesadores presentes en el servidor.
//   - Ejecutar el servidor (modos FORK y CLUSTER) con nodemon verificando el número de procesos tomados 
//     por node.
//   - Ejecutar el servidor (con los parámetros adecuados) utilizando Forever, verificando su correcta 
//     operación. Listar los procesos por Forever y por sistema operativo.
//   - Ejecutar el servidor (con los parámetros adecuados: modo FORK) utilizando PM2 en sus modos modo fork 
//     y cluster. Listar los procesos por PM2 y por sistema operativo.
//   - Tanto en Forever como en PM2 permitir el modo escucha, para que la actualización del código del 
//     servidor se vea reflejado inmediatamente en todos los procesos. (esto es, agregar --watch)
//   - Hacer pruebas de finalización de procesos fork y cluster en los casos que corresponda

// Configurar Nginx para balancear cargas de nuestro servidor de la siguiente manera:
// Redirigir todas las consultas a /api/randoms a un cluster de servidores escuchando en el puerto 8081. 
// El cluster será creado desde node utilizando el módulo nativo cluster.

// El resto de las consultas, redirigirlas a un servidor individual escuchando en el puerto 8080.
// Verificar que todo funcione correctamente.

// Luego, modificar la configuración para que todas las consultas a /api/randoms sean redirigidas a un 
// cluster de servidores gestionado desde nginx, repartiéndolas equitativamente entre 4 instancias 
// escuchando en los puertos 8082, 8083, 8084 y 8085 respectivamente.

// Incluir el archivo de configuración de nginx junto con el proyecto.

// Incluir también un pequeño documento en donde se detallen los comandos que deben ejecutarse por línea 
// de comandos y los argumentos que deben enviarse para levantar todas las instancias de servidores de modo 
// que soporten la configuración detallada en los puntos anteriores.

// Ejemplo:

//   -  pm2 start ./miservidor.js -- --port=8080 --modo=fork
//   -  pm2 start ./miservidor.js -- --port=8081 --modo=cluster
//   -  pm2 start ./miservidor.js -- --port=8082 --modo=fork
//   -  ...


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
      })
    }
    
      
      const args = yargs.default({ PORT: 8080, mode:'fork'}).argv
  
      console.log(`PORT: ${args.PORT} -- MODE: ${args.mode}`)
  
      //const PORT = process.env.PORT || 8080
  
      if(args.mode =='cluster'){   //Si el modo es Cluster...
  
        console.log('modo CLUSTER')
        if(cluster.isPrimary) {    // Si el proceso es padre...
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
          
