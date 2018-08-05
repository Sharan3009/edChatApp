const check = require('./checkLib')
const redis = require('redis')
let client = redis.createClient()

client.on('connect',()=>{
    console.log('Redis connection is successfully opened')
})

let getAllUsersInHash = (hashName, callback)=>{
    client.HGETALL(hashName,(err,result)=>{
        console.log(`Getting all online users for hash ${hashName}`)
        if(err){
            console.log(err)
            callback(err,null)
        } else if(check.isEmpty(result)){
            console.log('online user list is empty')
            console.log(result)
            callback(null,{})
        } else {
            console.log(result)
            callback(null,result)
        }
    })
}

let setANewOnlineUserInHash = (hashName,key,value,callback)=>{
    console.log(`setting user ${key} with value ${value} in hash ${hashName}`)

    client.HMSET(hashName,[key,value],(err, result)=>{
        if(err){
            console.log(err)
            callback(err,null)
        } else {
            console.log('user has been set in the hash map')
            console.log(result)
            callback(null,result)
        }
    })
}

let deleteUserFromHash = (hashName,key)=>{
    client.HDEL(hashName,key);
    return true
}

module.exports = {
    getAllUsersInHash : getAllUsersInHash,
    setANewOnlineUserInHash : setANewOnlineUserInHash,
    deleteUserFromHash : deleteUserFromHash
}