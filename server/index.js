import http from 'http'
import express from 'express'
import morgan from 'morgan'
import {Server as SocketServer} from 'socket.io'
import fs from 'fs'
import cors from 'cors'
import {PORT} from './config.js'
import path, { dirname } from 'path'


//Este no es un servidor http
const app = express()
const server = http.createServer(app)
const io = new SocketServer(server, {
    cors: 'http://localhost:5173'
})

//Cualquier servidor externo a localhost:3000 puede conectarse
app.use(cors())
app.use(morgan('dev'))

let users = []

io.on('connection', socket => {
    //console.log(socket.id)

    socket.on('user', (data, cb) => {
        console.log(data)
        const exists = users.some(user => user.username === data);
        if (exists) {
            cb(false)
        } else {
            cb(true)
            socket.user = {
                username: data,
                socketId: socket.id // Agregar la propiedad socketId al objeto socket.user
            }; 
            users.push(socket.user)
            console.log(users)
            io.sockets.emit('user', users)
        }
    })

    socket.on('message', message => {
        console.log(message)
    
        let msg = message.trim()
        let arr = msg.split(' ')
    
        if (arr[0] === "p") {
            let user = arr[1];
            let msgW = arr.slice(2).join(" ");;
            console.log(`Usuario: ${user}, Mensaje: ${msgW}`);
    
            // Buscar el socket asociado con el usuario en el arreglo users
            const userSocket = users.find(u => u.username === user);
            if (userSocket) {
                // Enviar el mensaje al socket asociado con el usuario
                io.to(userSocket.socketId).emit('message', {
                    body: '[Privado] '+msgW,
                    from: socket.user
                });
                io.to(socket.emit("message",{
                    body: '[Privado] '+msgW,
                    from: socket.user
                }))
            } else {
                console.log('El usuario no existe')
            }
          } else {
            io.sockets.emit('message', {
                body: message,
                from: socket.user
            });
        }
    })

    socket.on("upload-file", ({ filename, data }) => {
        // console.log(filename)
        // console.log(data)
        const fileBuffer = Buffer.from(data.split(",")[1], "base64");
        //console.log(fileBuffer)
        fs.writeFile(`./uploads/${filename}`, fileBuffer, (err) => {
            if (err) throw err;
            console.log('Archivo guardado')
            const filePath = path.join(process.cwd(), 'uploads', filename);
            console.log(filePath)
            fs.readFile(filePath, (err, data) => {
                if (err) {
                  console.error(err);
                } else {
                  // Emitir el evento con los datos de la imagen
                  io.sockets.emit('image-data', data, socket.user);
                }
            });
            
        })
    });

    socket.on('disconnect', data => {
        if(!socket.user) return
        users.splice(users.indexOf(socket.user),1)
        updateUsers()
    })

    const updateUsers = () => {
        io.sockets.emit('user', users)
    }
})

server.listen(PORT,() => {
    console.log(`Server listen on port ${PORT}`)
})

