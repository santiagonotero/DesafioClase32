const {Router} = require('express')
const controller = require('../models/routes.methods')
const api = require('../models/api.methods')
const {auth}= require ('../middlewares/auth')

const router = Router()


router.get('/', auth, controller.main)
router.get('/login', controller.loginGet)
router.post('/login' , controller.loginPost) 
router.get('/register', controller.registerGet)
router.post('/register' , controller.registerPost)
router.post('/logout' , controller.logoutPost)
router.get('/logout', auth, controller.logoutGet)
router.get('/add', controller.addGet)
router.post('/add', controller.addPost)
router.get('/info', controller.infoGet)
router.get('/api/randoms', api.randoms)
router.get('/api/productos-test', api.productosTest)
router.get('*', controller.defaultGet)


  module.exports = router