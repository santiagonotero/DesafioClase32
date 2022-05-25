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
  
  
  mongoose.connect(`${process.env.MONGODB_SCHEMA}://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_HOSTNAME}/${process.env.MONGODB_DATABASE}?${process.env.MONGODB_OPTIONS}`).then(()=>{
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
        mongoUrl: `${process.env.MONGODB_SCHEMA}://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_HOSTNAME}/${process.env.MONGODB_DATABASE}?${process.env.MONGODB_OPTIONS}`,
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
      msgMethod.cargarMensajes().then((listaMensajes)=>{
        socket.emit('messages', listaMensajes)
      })

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
            io.sockets.emit('server:productList', listaProductos)
          })
        })    
        
      })
      
      server.listen(PORT, function () {   //antes era args.port
        logger.info(`Servidor corriendo en http://localhost:${PORT}`)

      })
    }
    
      
      const args = yargs.default({ PORT: 8080, mode:'fork'}).argv
  
      const PORT = process.env.PORT || 8080
  
      if(args.mode =='cluster'){   //Si el modo es Cluster...
  
        console.log('modo CLUSTER')
        if(cluster.isMaster) {    // Si el proceso es padre...
          for(let i=0; i<=numCPUs; i++){
            
            logger.info('Nuevo proceso FORK creado')
            cluster.fork()
            
          }
          
          cluster.on('exit', (worker, code, signal)=>{
            logger.info(`worker ${worker.process.id} murió`)
          })
          
          logger.info(`Proceso primario ${process.pid}`)
        }   //if(mode == 'cluster')
  
        else{           // Si el proceso es hijo en modo cluster...
            iniciarMain()
        }      
      }
  
      else{
          logger.info('Modo FORK')
          iniciarMain()
      }
      
})()                                                                               // O si el modo es fork...
          
