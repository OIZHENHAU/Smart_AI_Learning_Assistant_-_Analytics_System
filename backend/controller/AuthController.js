import jwt from "jsonwebtoken";
import User from "../models/User.js";

function generateUserToken(id) {
    return jwt.sign({id}, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || "1d"
    });
}

export const register = async(req, res, nxt) => {
    try {
        const {username, email, password, phoneNumber} = req.body;

        const userExists = await User.findMatchEmail(email);

        //If user already exist in the database
        if (userExists && userExists.email === email.toLowerCase()) {
            return res.status(400).json({
                success: false,
                error: (userExists.email === email) ? "Email already registered!" : "Email is taken by other users!",
                statusCode: 400,
            });
        }

        //Else create user
        const userId = await User.create({username, email, password, phone_number: phoneNumber});

        //Generate token
        const token = generateUserToken(userId);

        res.status(200).json({
            success: true,
            data: {
                user: {
                    id: userId,
                    username: username,
                    email: email,
                    phonenumber: phoneNumber
                },
                token,
            },
            message: "User registered successfully!"
        });

    } catch (error) {
        console.error("Register new account failed due to: " + error);
        nxt(error);
    }
}

export const login = async(req, res, nxt) => {
    try {

    } catch (error) {
        console.error("Login failed due to: " + error);
        nxt(error);
    }

}

//View user profile: GET /api/auth/profile
export const viewProfile = async(req, res, nxt) => {
    try {

    } catch (error) {
         console.error("Fail to get user profile: " + error);
         nxt(error);
    }
};

//Update user profile: PUT /api/auth/profile
export const updateProfile = async(req, res, nxt) => {
    try {

    } catch (error) {
        console.error("Fail to update user profile: " + error);
        nxt(error);
    }
};

//Change password: POST /api/auth/password-change
export const changePassword = async(req, res, nxt) => {
    try {

    } catch (error) {
        console.error("Fail to change the new password: " + error);
        nxt(error);
    }
};

