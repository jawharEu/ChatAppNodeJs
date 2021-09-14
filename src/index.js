const express = require('express')
const path = require('path')
const http = require('http')
const socketio = require('socket.io')
const Filter = require('bad-words')

const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')


const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000


//const viewsPath = path.join(__dirname, '../public/views')


//app.set('view engine', 'hbs')
//app.set('views', viewsPath) //customise views directory path

const publicDirPath = path.join(__dirname, '../public')

app.use(express.static(publicDirPath))



io.on('connection', (socket) => {
    console.log('New web socket connection !');

    socket.on('join', ({ username, room }, callback) => {
        const { error, user } = addUser({ id: socket.id, username, room })


        if (error) {
            return callback(error)
        }

        socket.join(user.room) //allows to join a give chat room

        socket.emit('message', generateMessage('Admin', 'Welcome !'))

        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined !`)) //emit for all connected client except who has joined and cause the event

        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })


        callback()

    })


    socket.on('sendmessage', (msg, callback) => {
        const user = getUser(socket.id)

        const filter = new Filter()

        if (filter.isProfane(msg)) {
            return callback('Profanity is not allowed !')
        }

        if (!user) {
            return callback(new Error('Cannot find this user !'))
        }

        io.to(user.room).emit('backmessage', generateMessage(user.username, msg))
        callback()
    })

    socket.on('sendLocation', (coords, callback) => {
        const user = getUser(socket.id)

        if (!user) {
            return callback(new Error('Cannot find this user !'))
        }

        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`))

        callback()

    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if (user) {
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left !`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }

    })

})



server.listen(port, () => {
    console.log(`Server is up on port ${port} !`);
})