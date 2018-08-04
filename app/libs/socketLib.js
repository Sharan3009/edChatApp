const socketio = require('socket.io')
const mongoose = require('mongoose')
const shortid = require('shortid')
const logger = require('./loggerLib')
const events = require('events')
const eventEmitter = new events.EventEmitter()
const ChatModel = mongoose.model('Chat')

const tokenLib = require('./tokenLib')
const check = require('./checkLib')
const response = require('./responseLib')

let setServer = (server) =>{
    let allOnlineUsers = []
    let io = socketio.listen(server)
    let myIo = io.of('/chat')  //namespace

    myIo.on('connection',(socket) => {
        console.log('on connection -- emitting verify user')
        socket.emit('verifyUser','')

        socket.on('set-user',(authToken)=>{
            console.log('set-user called')
            tokenLib.verifyClaimWithoutSecret(authToken , (err,user)=>{
                if(err){
                    socket.emit('auth-error',{status:500, error:'Please provide correct auth token'})
                } else {
                    console.log('user is verified.. setting details')
                    let currentUser = user.data
                    // this will be used through out the socket
                    socket.userId = currentUser.userId
                    let fullName =`${currentUser.firstName} ${currentUser.lastName}`
                    console.log(`${fullName} is online`)
                    // socket.emit(currentUser.userId,"You are online")

                    let userObj = {userId : currentUser.userId, fullName : fullName}
                    allOnlineUsers.push(userObj)
                    console.log(allOnlineUsers)

                    socket.room = 'edChat'
                    socket.join(socket.room)
                    socket.to(socket.room).broadcast.emit('online-user-list',allOnlineUsers)
                }

            })
        })
        socket.on('disconnect', ()=>{
            console.log('user is disconected')
            console.log(socket.userId)
            var removeIndex = allOnlineUsers.map(function(user){return user.userId}).indexOf(socket.userId)
            allOnlineUsers.splice(removeIndex,1)
            console.log(allOnlineUsers)

            socket.to(socket.room).broadcast.emit('online-user-list',allOnlineUsers)
            socket.leave(socket.room)
        })

        socket.on('chat-msg',(data)=>{
            console.log('socket chat-msg called')
            console.log(data)
            data['chatId']=shortid.generate()
            setTimeout(function(){eventEmitter.emit('save-chat',data)},2000)
            myIo.emit(data.receiverId,data)
        })

        socket.on('typing',(fullName)=>{
            socket.to(socket.room).broadcast.emit('typing',fullName)
        })
    })
}

eventEmitter.on('save-chat', (data) => {

    // let today = Date.now();

    let newChat = new ChatModel({

        chatId: data.chatId,
        senderName: data.senderName,
        senderId: data.senderId,
        receiverName: data.receiverName || '',
        receiverId: data.receiverId || '',
        message: data.message,
        chatRoom: data.chatRoom || '',
        createdOn: data.createdOn

    });

    newChat.save((err,result) => {
        if(err){
            console.log(`error occurred: ${err}`);
        }
        else if(result == undefined || result == null || result == ""){
            console.log("Chat Is Not Saved.");
        }
        else {
            console.log("Chat Saved.");
            console.log(result);
        }
    });

});

module.exports = {
    setServer : setServer
}