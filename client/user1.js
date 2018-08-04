const socket = io('http://localhost:3000/chat')
const authToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RpZCI6ImdadEo1U290QyIsImlhdCI6MTUzMzI3OTUxOTI5NCwiZXhwIjoxNTMzMzY1OTE5LCJzdWIiOiJhdXRoVG9rZW4iLCJpc3MiOiJlZENoYXQiLCJkYXRhIjp7InVzZXJJZCI6Ind5cEliU3ltdyIsImZpcnN0TmFtZSI6IlNoYXJhbmRlZXAiLCJsYXN0TmFtZSI6IlNpbmdoIiwiZW1haWwiOiJzc3NAZ21haWxsLmNvbSIsIm1vYmlsZU51bWJlciI6OTA0MTk1MDE0MH19.sYkIjHts7Tk0fBGH1y1mUzT79X_aD9R30iFaBWSK3NY"
const userId = "wypIbSymw"

let chatMessage =  {
    createdOn : Date.now(),
    receiverId : 'dHwPKt3eC',
    receiverName: 'Mharandeep Singh',
    senderId : userId,
    senderName : 'Sharandeep Singh'
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

    socket.on('online-user-list',(data)=>{
        console.log('Online user list updated. some user came online or went offline')
        console.log(data)
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