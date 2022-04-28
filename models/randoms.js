const http = require('http')
const server = http.createServer()

let cantNumeros

const randoms=(cant=100000000)=>{

    let listaNum = {}

    console.log('cant: ' + cant)

    for(let i=0;i<cant; i++){

        let numRandom = Math.random()*1000
        numRandom = numRandom.toFixed(0)

        listaNum[numRandom] = (listaNum[numRandom] || 0 ) +1

    } 

    cantNumeros = cant
    return listaNum
}

   process.on('message', (msg)=>{
       if (msg.message === 'START'){
            const listado = randoms(msg.cant)
            process.send({msg:'terminado', listado:listado, cant:cantNumeros})
       }
   }) 

  
