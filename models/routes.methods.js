const passport = require('passport')
const modelProductos = require('../models/productos')
const modelMensajes = require('../models/mensajes')
const CPUS = require("os").cpus().length
const logger = require("../Logs/winston")

module.exports={
    main: async (req,res)=>{

        logger.info('Un usuario accedió al sitio')
        const items = await modelProductos.cargarProductos()
        const mensajes = await modelMensajes.cargarMensajes() 
        const name = req.user.nombre
        res.render('index' , { name: name, mensajes: mensajes, items: items})
        },

    loginGet: (req, res)=>{
        logger.info('Usuario accedió a la ruta /login')
        res.render('login' , {layout: 'login'})
        },

    loginPost: passport.authenticate("login", {
        successRedirect: "/",
        failureRedirect: "/login",
        failureFlash: true
        }), 

    registerGet: (req, res)=>{
        logger.info('Usuario accedió a la ruta /register')
        res.render('register', {layout: 'register'})
        },

    registerPost: passport.authenticate("register", { 
        successRedirect: "/",
        failureRedirect: "/register",
        failureFlash: true
        }),
    
    logoutPost: (req, res)=>{
        const {username} = req.user.nombre
        res.render('logout', {name: username})
        },

    logoutGet: (req, res)=>{
        logger.info('Usuario accedió a la ruta /logout')
        const name = req.user.nombre
        req.logOut()
        res.render('logout', {layout: 'logout', name: name })
        },

    addGet: (req,res)=>{
        logger.info('Usuario accedió a la ruta /add')
        res.render('add')
        },

    addPost: (req,res)=>{
        res.redirect('/')
        },
    
    infoGet: (req,res)=>{
        logger.info('Usuario accedió a la ruta /info')
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
        },

    defaultGet: (req,res)=>{
        logger.warn('Se solicitó una ruta inexistente')
        res.sendStatus(404)
        }
}