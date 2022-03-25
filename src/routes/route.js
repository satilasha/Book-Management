const express = require('express');
const router = express.Router();

const userController = require('../controller/userController')
const bookController = require('../controller/bookController')
 const middleware = require('../middleware/auth')
 const reviewContoller = require('../controller/reviewController')

// post for user

router.post('/register',userController.createUser)


module.exports = router;