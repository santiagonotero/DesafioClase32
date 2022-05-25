const path = require('path')
const faker = require("../Faker/index")
const {fork} = require ('child_process')
const logger = require("../Logs/winston")

module.exports ={
    randoms: async (req,res)=>{

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
    },

    productosTest: (req,res)=>{

        logger.info('Usuario accedió a la ruta /api/productos-test')
        const listaFake = faker.crearLista()
        res.render('faker', { listaFake: listaFake })
      }
}