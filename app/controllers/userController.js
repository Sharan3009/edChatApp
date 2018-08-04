const express = require('express')
const mongoose = require('mongoose');
const shortid = require('shortid');
const time = require('./../libs/timeLib');
const response = require('./../libs/responseLib')
const logger = require('./../libs/loggerLib');
const validateInput = require('../libs/paramsValidationLib')
const passwordLib = require('../libs/generatePasswordLib')
const token = require('../libs/tokenLib')
const check = require('../libs/checkLib') 

/* Models */
const UserModel = mongoose.model('User')
const AuthModel = mongoose.model('Auth')

// User Signup function 
let getAllUser = (req, res) => {
	UserModel.find()
		.select('-password -_id -__v')
		.lean()
		.exec((err, result) => {
			if (err) {
				logger.error(err.message, 'User Controller: getAllUser', 10)
				let apiResponse = response.generate(true, 'Error occured while getting all the users', 500, null)
				res.send(apiResponse)
			} else if (check.isEmpty(result)) {
				logger.info('No Users Found', 'User Controller: getAllUser', 5)
				let apiResponse = response.generate(true, 'No Users Found', 404, null)
				res.send(apiResponse)
			} else {
				logger.info('Users Found', 'User Controller: getAllUser', 5)
				let apiResponse = response.generate(false, 'Users Found', 200, result)
				res.send(apiResponse)
			}
		})
}

let getSingleUser = (req, res) => {
	UserModel.findOne({ userId: req.params.userId })
		.select('-password -_id -__v')
		.lean()
		.exec((err, result) => {
			if (err) {
				logger.error(err.message, 'User Controller: getSingleUser', 10)
				let apiResponse = response.generate(true, 'Error occured while getting the user', 500, null)
				res.send(apiResponse)
			} else if (check.isEmpty(result)) {
				logger.info('No User Found', 'User Controller: getSingleUser', 5)
				let apiResponse = response.generate(true, 'No Users Found', 404, null)
				res.send(apiResponse)
			} else {
				logger.info('User Found', 'User Controller: getSingleUser', 5)
				let apiResponse = response.generate(false, 'User Found', 200, result)
				res.send(apiResponse)
			}
		})
}

let editUser = (req, res) => {
    //while editing user, password do not go as hashpassword
	let options = req.body;
	UserModel.update({ 'userId': req.params.userId }, options, { multi: true }, (err, result) => {
		if (err) {
			logger.error(err.message, 'User Controller: editUser', 10)
			let apiResponse = response.generate(true, 'Error occured while updating the Credentials', 500, null)
			res.send(apiResponse)
		} else if (check.isEmpty(result)) {
			logger.info('No User Found', 'User Controller: editUser', 5)
			let apiResponse = response.generate(true, 'No User Found', 404, null)
			res.send(apiResponse)
		} else {
			logger.info('User successfully Edited', 'User Controller: editUser', 5)
			let apiResponse = response.generate(false, 'User successfully updated', 200, result)
			res.send(apiResponse)
		}
	})
}

let deleteUser = (req, res) => {
	UserModel.remove({ 'userId': req.params.userId }, (err, result) => {
		if (err) {
			logger.error(err.message, 'User Controller: deleteUser', 10)
			let apiResponse = response.generate(true, 'Error occured while deleting the User', 500, null)
			res.send(apiResponse)
		} else if (check.isEmpty(result)) {
			logger.info('No User Found', 'User Controller: deleteUser', 5)
			let apiResponse = response.generate(true, 'No User Found', 404, null)
			res.send(apiResponse)
		} else {
			logger.info('User successfully Deleted', 'User Controller: deleteUser', 5)
			let apiResponse = response.generate(false, 'User successfully deleted', 200, result)
			res.send(apiResponse)
		}
	})
}

let signUpFunction = (req, res) => {

    let validateUserInput = () =>{
        return new Promise((resolve,reject)=>{
            if(req.body.email){
                if(!validateInput.Email(req.body.email)){
                    let apiResponse = response.generate(true,'Email Does not meet the requirement',400,null)
                    reject(apiResponse)
                } else if (check.isEmpty(req.body.password)){
                    let apiResponse = response.generate(true,'password parameter is missing',400,null)
                    reject(apiResponse)
                } else {
                    //check this 
                    resolve(req)
                }
            } else {
                logger.error('Field Missing during User creation','User Controller : validateUserInput' , 5)
                let apiResponse = response.generate(true,'One or more Parameter(s) is missing',400,null)
                reject(apiResponse)
            }
        })
    }
    let createUser = () =>{
        return new Promise((resolve,reject)=>{
            UserModel.findOne({email:req.body.email})
            .exec((err, retrievedUserDetails)=>{
                if(err){
                    logger.error(err.message,'User Controller : createUser',5)
                    let apiResponse = response.generate(true,'Failed to create User',400,null)
                    reject(apiResponse)
                } else if (check.isEmpty(retrievedUserDetails)) {
                    console.log(req.body)
                    let newUser = new UserModel({
                        userId : shortid.generate(),
                        firstName : req.body.firstName,
                        lastName : req.body.lastName || '',
                        email : req.body.email.toLowerCase(),
                        mobileNumber : req.body.mobileNumber,
                        password : passwordLib.hashpassword(req.body.password),
                        createdOn : time.now()
                    })
                    newUser.save((err,newUser)=>{
                        if(err){
                            console.log(err)
                            logger.error(err.message,'User Controller : createUser', 10)
                            let apiResponse = response.generate(true,'Failed to create new user',400,null)
                            reject(apiResponse)
                        } else {
                            // delete keyword will not working until you convert it to js object using toObject()
                            let newUserObj = newUser.toObject()
                            resolve(newUserObj)
                        }
                    })
                } else {
                    logger.info('User cannot be created. User already present','User Controller : createUser',5)
                    let apiResponse = response.generate(true,'User already present with this email',403,null)
                    reject(apiResponse)
                } 
            })
        })
    }
    validateUserInput(req,res)
    .then(createUser)
    .then((resolve)=>{
        delete resolve.password
        delete resolve._id
        delete resolve.__v
        let apiResponse = response.generate(false,'User created',200,resolve)
        res.send(apiResponse)
    })
    .catch((err)=>{
        console.log(err)
        res.send(err)
    })
} 

// Login function 
let loginFunction = (req, res) => {
    let findUser = () => {
        console.log('findUser')
        return new Promise((resolve,reject)=>{
            if(req.body.email){
                console.log('req body email is there')
                console.log(req.body)
                UserModel.findOne({email: req.body.email},(err,userDetails)=>{
                    if(err){
                        console.log(err)
                        logger.error('Failed to Retrieve User Data', 'User Controller : findUser',5)
                        let apiResponse = response.generate(true,'Failed to find the user',400,null)
                        reject(apiResponse)
                    } else if (check.isEmpty(userDetails)) {
                        logger.error('No User Found','User Controller : findUser',5)
                        let apiResponse = response.generate(true,'No User Details Found',400,null)
                        reject(apiResponse)
                    } else {
                        logger.info('User Found','User Controller : findUser',5)
                        // and this
                        resolve(userDetails)
                    }
                })
            } else {
                let apiResponse = response.generate(true,'email parameter is missing',400,null)
                reject(apiResponse)
            }
        })
    }

    let validatePassword = (retrievedUserDetails) => {
        console.log('validate password')
        return new Promise((resolve,reject)=>{
            passwordLib.comparePassword(req.body.password,retrievedUserDetails.password,(err,isMatch)=>{
                if(err){
                    console.log(err)
                    logger.error(err.message,'User Controller : validatePassword',5)
                    let apiResponse = response.generate(true,'Login Failed',500,null)
                    reject(apiResponse)
                } else if (isMatch) {
                    let retrievedUserDetailsObj = retrievedUserDetails.toObject()
                    delete retrievedUserDetailsObj.password
                    delete retrievedUserDetailsObj._id
                    delete retrievedUserDetailsObj.__v
                    delete retrievedUserDetailsObj.createdOn
                    delete retrievedUserDetailsObj.modifiedOn
                    resolve(retrievedUserDetailsObj)
                } else {
                    logger.error('Login failed due to incorrect password','User Controller : validatePassword',5)
                    let apiResponse = response.generate(true,'Wrong password . Login Failed',500,null)
                    reject(apiResponse)
                }
            })
           
        })
    }

    let generateToken = (userDetails) => {
        console.log('generate token');
        return new Promise ((resolve,reject)=>{
            token.generateToken(userDetails,(err,tokenDetails)=>{
                if(err){
                    console.log(err)
                    let apiResponse = response.generate(true,'Failed to generate token',500,null)
                    reject(apiResponse)
                } else {
                    tokenDetails.userId = userDetails.userId
                    tokenDetails.userDetails = userDetails
                    resolve(tokenDetails)
                }
            })
        })
    }

    let saveToken = (tokenDetails) => {
        console.log('save token')
        return new Promise((resolve,reject)=>{
            AuthModel.findOne({userId : tokenDetails.userId })
            .exec((err, retrievedTokenDetails)=>{
                if(err){
                    logger.error(err.message,'User Controller : saveToken',5)
                    let apiResponse = response.generate(true,'Failed to generate token',400,null)
                    reject(apiResponse)
                } else if (check.isEmpty(retrievedTokenDetails)) {
                    let newAuthToken = new AuthModel({
                        userId : tokenDetails.userId,
                        authToken : tokenDetails.token,
                        tokenDetails : tokenDetails.tokenDetails,
                        tokenSecret : tokenDetails.tokenSecret,
                        tokenGenerationTime : time.now()
                    })
                    newAuthToken.save((err,newTokenDetails)=>{
                        if(err){
                            console.log(err)
                            logger.error(err.message,'User Controller : saveToken', 10)
                            let apiResponse = response.generate(true,'Failed to generate new token',400,null)
                            reject(apiResponse)
                        } else {
                            let responseBody = {
                                authToken : newTokenDetails.authToken,
                                userDetails : tokenDetails.userDetails
                            }
                            resolve(responseBody)
                        }
                    })
                } else {
                    retrievedTokenDetails.authToken = tokenDetails.token
                    retrievedTokenDetails.tokenSecret = tokenDetails.tokenSecret
                    retrievedTokenDetails.tokenGenerationTime = time.now()
                    retrievedTokenDetails.save((err,newTokenDetails)=>{
                        if(err){
                            console.log(err)
                            logger.error(err.message,'User Controller : saveToken',10)
                            let apiResponse = response.generate(true,'Failed to generate Token',400,null)
                            reject(apiResponse)
                        } else {
                            let responseBody = {
                                authToken : newTokenDetails.authToken,
                                userDetails : tokenDetails.userDetails
                            }
                            resolve(responseBody)
                        }
                    })
                } 
            })
        })
    }

    findUser(req,res)
    .then(validatePassword)
    .then(generateToken)
    .then(saveToken)
    .then((resolve)=>{
        let apiResponse = response.generate(false,'Login successful',200,resolve)
        res.status(200)
        res.send(apiResponse)
    })
    .catch((err)=>{
        console.log('error handler')
        console.log(err)
        res.status(err.status)
        res.send(err)
    })
}

// Logout function.
let logout = (req, res) => {
  AuthModel.remove({ userId: req.user.userId },(err,result)=>{
      if(err) {
          console.log(err)
          logger.error(err.message , 'User Controller : logout',10)
          let apiResponse = response.generate(true,`error occured : ${err.message}`,500,null)
          res.send(apiResponse)
      } else if (check.isEmpty(result)) {
          let apiResponse = response.generate(true,'Already logged out or invalid user',404,null)
          res.send(apiResponse)
      } else {
          let apiResponse = response.generate(false,'Logged out successfully',200,result)
          res.send(apiResponse)
      }
  })
}


module.exports = {
    getAllUser : getAllUser,
    getSingleUser : getSingleUser,
    editUser : editUser,
    deleteUser : deleteUser,
    signUpFunction: signUpFunction,
    loginFunction: loginFunction,
    logout: logout

}