const mongoose = require('mongoose')
const logger = require("../Logs/winston")

class Productos{

    constructor(){
        const schema = new mongoose.Schema({
                nombre: String,
                precio: Number,
                foto: String
        })

        this.model = mongoose.model('productos', schema)
    }

    async agregarProducto(obj){
        try{

            //normalizar producto

            const producto = await this.model.create(obj)
            return producto
        }
        catch(err){
            logger.error('Error agregando producto')
           console.log(err)
        }
    }
    async cargarProductos(){
        try{ 
            const data = await this.model.find().lean()
            return data
        }
        catch(err){
            logger.error('Error cargando producto')
            console.log(err)
        }
    }

}

module.exports = new Productos();