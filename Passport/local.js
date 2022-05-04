const LocalStrategy = require('passport-local').Strategy
const Usuarios = require('../models/users')
const logger = require("../Logs/winston")

module.exports = (passport) =>{

    const authUser = async (email, password, done) => {
        try {
          // Verifica que exista el email
          if (!await Usuarios.existsByEmail(email)) {
            // regresar al usuario a la misma pantalla
            logger.error('No existe usuario')
            //console.log("no existe desde passport")
            return done(null, false, { message: 'user does not exist!' })
          }
    
          // Verifica que los passwords coincidan
          // { messages.error: []} // array de errores
          if (!await Usuarios.isPasswordValid(email, password)) {
            logger.warn('Contraseña incorrecta')
            return done(null, false, { message: 'incorrect password!' }) 
          }
    
          // obtener el usuario
          const user = await Usuarios.getByEmail(email)
    
          done(null, user)
        } catch (e) {
            logger.error(`Error de autorización ${e}`)
            done(e)
        }
      }

    const registerUser = async (req, email, password, done) => {
        const { nombre } = req.body
        try {
          // Verificar que no exista el email
          if (await Usuarios.existsByEmail(email)) {
            // regresar al usuario a la misma pantalla
            logger.error("Ya existe un usuario con este email")
            return done(null, false, { message: 'user already exists!' })
          }
          // guardar usuario en db
          const user = await Usuarios.save({
            email,
            password,
            nombre
          })
    
          done(null, {
            ...user,
            id: user._id
          })
        } catch (err) {
          logger.error(`Error de registro ${err}`)
          done(err)
        }
      }

    passport.use('login', new LocalStrategy({ usernameField: 'email', passwordField: 'password'}, authUser))
    passport.use('register', new LocalStrategy({usernameField: 'email', passwordField: 'password', passReqToCallback: true }, registerUser))

    passport.serializeUser((user,done)=>done(null, user.id))
    passport.deserializeUser(async (id, done)=> {
        const user= await Usuarios.getById(id)
        done(null, {
        id: user._id.toString(),
        email: user.email,
        nombre: user.nombre
                    }
            )
        }
    )
    
}