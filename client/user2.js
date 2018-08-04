const socket = io('http://localhost:3000/chat')
const authToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RpZCI6Il96Z2lVMVZ3biIsImlhdCI6MTUzMzM2MDY1MTA4NSwiZXhwIjoxNTMzNDQ3MDUxLCJzdWIiOiJhdXRoVG9rZW4iLCJpc3MiOiJlZENoYXQiLCJkYXRhIjp7InVzZXJJZCI6ImRId1BLdDNlQyIsImZpcnN0TmFtZSI6Ik1oYXJhbmRlZXAiLCJsYXN0TmFtZSI6IlNpbmdoIiwiZW1haWwiOiJzc0BnbWFpbGwuY29tIiwibW9iaWxlTnVtYmVyIjo5MDQxOTUwMTQwfX0.RSpxp5u3U4j4UwWhBxvOPBG9nv4fSUy1zbtMqI12UpQ"
const userId = "dHwPKt3eC"

let chatMessage =  {
    createdOn : Date.now(),
    receiverId : 'wypIbSymw',
    receiverName: 'Sharandeep Singh',
    senderId : userId,
    senderName : 'Mharandeep Singh'
}

let chatSocket = () => {
    socket.on('verifyUser',(data)=>{
        console.log('socket trying to verify user');
        socket.emit('set-user', authToken)
    })

    socket.on(userId,(data)=>{
        console.log('you received a message from ' + data.senderName)
        console.log(data.message)
    })

    $('#send').on('click',function(){
        let messageText = $('#messageToSend').val()
        chatMessage.message = messageText;
        socket.emit('chat-msg',chatMessage)
    })

    $('#messageToSend').on('keypress',function(){
        socket.emit('typing','Mharandeep Singh')
    })
    socket.on('typing',(data)=>{
        console.log(data+' is typing')
    })
}

chatSocket()