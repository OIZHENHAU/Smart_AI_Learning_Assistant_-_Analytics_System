import express from 'express';
import {body} from 'express-validator';
import protect from '../middleware/Auth.js'
import {
    register,
    login,
    viewProfile,
    updateProfile,
    changePassword
} from "../controller/AuthController.js";


const router = express.Router();

const registerValidationCheck = [
    body('username').trim().isLength({min: 3}).withMessage('The username must have at least 3 characters.'),
    body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email.'),
    body('password').isLength({min: 5}).withMessage("The password must have at least 5 characters.")

];

const loginValidationCheck = [
    body('email').isEmail().normalizeEmail().withMessage("Please enter a valid email."),
    body('password').isLength({min: 0}).withMessage("Password cannot be left empty.")
];

router.post("/register", registerValidationCheck, register);
router.post("/login", loginValidationCheck, login);

router.get('/profile', protect, viewProfile);
router.put('/profile', protect, updateProfile);
router.post('/change-password', protect, changePassword);

export default router;
