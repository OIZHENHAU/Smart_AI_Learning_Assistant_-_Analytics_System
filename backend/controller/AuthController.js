import jwt from "jsonwebtoken";
import User from "../models/User.js";

function generateUserToken(id) {
    return jwt.sign({id}, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || "1d"
    });
}

export const register = async(req, res, nxt) => {
    try {

    } catch (error) {
        console.error("Register new account failed due to: " + error);
        nxt(error);
    }
}

export const login = async(req, res, nxt) => {
    try {

    } catch (error) {
        console.error("Login failed due to: " + error);
    }

}