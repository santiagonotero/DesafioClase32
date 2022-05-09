const path = require('path')
const http = require('http')
const {Router} = require('express')
const faker = require("../Faker/index")
const {auth}= require ('../middlewares/auth')
const passport = require('passport')
const modelProductos = require('../models/productos')
const modelMensajes = require('../models/mensajes')
const CPUS = require("os").cpus().length
const {fork} = require ('child_process')
const logger = require("../Logs/winston")

const router = Router()

const server = http.createServer()


router.get('/', auth, async (req,res)=>{

    logger.info('Un usuario accedió al sitio')

    const items = await modelProductos.cargarProductos()
    const mensajes = await modelMensajes.cargarMensajes()  
    
    console.log(req.user)
    const name = req.user.nombre

    res.render('index' , { items: items, name: name, mensajes: mensajes})

})

router.get('/login', (req, res)=>{

    logger.info('Usuario accedió a la ruta /login')

    res.render('login' , {layout: 'login'})
})

router.post('/login' , passport.authenticate("login", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true
}) 
)

router.get('/register', (req, res)=>{

    logger.info('Usuario accedió a la ruta /register')

    res.render('register', {layout: 'register'})
})

router.post('/register' , passport.authenticate("register", { 

    successRedirect: "/",
    failureRedirect: "/register",
    failureFlash: true
}))

router.post('/logout' , (req, res)=>{
    const {username} = req.user.nombre

    res.render('logout', {name: username})
})

router.get('/logout', auth, (req, res)=>{

    logger.info('Usuario accedió a la ruta /logout')

    const name = req.user.nombre

    req.logOut()
    res.render('logout', {layout: 'logout', name: name })
})

router.get('/add', (req,res)=>{

    logger.info('Usuario accedió a la ruta /add')

    res.render('add')
})

router.post('/add', (req,res)=>{
    res.redirect('/')
})

router.get('/info', (req,res)=>{

    logger.info('Usuario accedió a la ruta /info')

    // console.log (   `layout: 'info', 
    //                 rss:${process.memoryUsage().rss.toString()},
    //                 argv: ${process.argv},
    //                 cwd: ${process.cwd()},
    //                 nodeVersion: ${process.env.npm_config_node_version},
    //                 execPath: ${process.execPath},
    //                 versionSO: ${process.env.OS},
    //                 pid: ${process.pid.toString()},
    //                 cpus: ${CPUS}`
    //                 )

    res.render('info', {
        layout: 'info', 
        rss:process.memoryUsage().rss.toString(),
        argv: process.argv,
        cwd: process.cwd(),
        nodeVersion: process.env.npm_config_node_version,
        execPath: process.execPath,
        versionSO: process.env.OS,
        pid: process.pid.toString(),
        cpus: CPUS
    })
})

router.get('/api/randoms', async (req,res)=>{

    let {cant} = req.query

    let array={}

    logger.info('Usuario accedió a la ruta /api/randoms')

    const procesoHijo = await fork(path.join(__dirname, '../models/randoms.js'))

    procesoHijo.send({
        message: 'START',
        cant: cant
    })

    procesoHijo.on('message', (devuelto)=>{
        if(devuelto.msg ==='terminado'){
            array = JSON.stringify(devuelto.listado, null,2)
            cant = cant || devuelto.cant

            res.render('randoms', {layout: 'randoms', array:array, cant})
       }
   })
})

// router.get('/api/productos-test', (req,res)=>{

//     logger.info('Usuario accedió a la ruta /api/productos-test')
//     const listaFake = faker.crearLista()
//     res.render('faker', { listaFake: listaFake })
//   })


  router.get('*', (req,res)=>{
      logger.warn('Se solicitó una ruta inexistente')
      res.sendStatus(404)
  })


  module.exports = router