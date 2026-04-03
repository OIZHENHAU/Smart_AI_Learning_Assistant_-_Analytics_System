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
        const { email, password } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                error: "Please provide a valid email when login.",
                statusCode: 400
            });
        }

        if (!password) {
            return res.status(400).json({
                success: false,
                error: "Please provide a password when login.",
                statusCode: 400
            });
        }

        const validUser = await User.findMatchEmail(email);
        
        if (!validUser) {
            return res.status(400).json({
                success: false,
                error: "The email is not yet registered.",
                statusCode: 400
            });
        }

        const isPasswordMatch = await User.findMatchPassword(password, validUser.password_hash);

        if (!isPasswordMatch) {
            return res.status(400).json({
                success: false,
                error: "Invalid password.",
                statusCode: 400
            });
        }

        const token = generateUserToken(validUser.id);

        return res.status(200).json({
            success: true,
            data: {
                user: {
                    id: validUser.id,
                    username: validUser.username,
                    email: validUser.email,
                    phoneNumber: validUser.phone_number
                }
            },
            token,
            message: "Login successful."
        });

    } catch (error) {
        console.error("Login failed due to: " + error);
        nxt(error);
    }

}

//View user profile: GET /api/auth/profile
export const viewProfile = async(req, res, nxt) => {
    try {
        const currentUser = await User.findAcountById(req.user.id);

        return res.status(200).json({
            success: true,
            data: {
                id: currentUser.id,
                username: currentUser.username,
                email: currentUser.email,
                phoneNumber: currentUser.phone_number,
                createdAt: currentUser.created_at,
                updatedAt: currentUser.updated_at
            }
        });

    } catch (error) {
         console.error("Fail to get user profile: " + error);
         nxt(error);
    }
};

//Update user profile: PUT /api/auth/profile
export const updateProfile = async(req, res, nxt) => {
    try {
        const {username, email, phoneNumber} = req.body;
        const userId = req.user.id;
        const currentUser = await User.findAcountById(userId);

        if (!currentUser) {
            return res.status(404).json({
                success: false,
                error: "No user was found when updating.",
                statusCode: 404
            });
        }

        await User.updateUserProfile(userId, {
            username: username || currentUser.username,
            email: email || currentUser.email,
            phone_number: phoneNumber || currentUser.phone_number
        });

        return res.status(200).json({
            success: true,
            data: {
                id: currentUser.id,
                username: currentUser.username,
                email: currentUser.email,
                phoneNumber: currentUser.phone_number
            },
            message: "Profile updated successfully."
        })

    } catch (error) {
        console.error("Fail to update user profile: " + error);
        nxt(error);
    }
};

//Change password: POST /api/auth/change-password
export const changePassword = async(req, res, nxt) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;

        const userId = req.user.id;

        const currentUser = await User.findAcountById(userId);

        if (!currentPassword) {
            return res.status(400).json({
                success: false,
                error: "Please provide the current password.",
                statusCode: 400
            });
        }

        if (!newPassword) {
            return res.status(400).json({
                success: false,
                error: "Please provide the new password",
                statusCode: 400
            });
        }

        if (!confirmPassword) {
            return res.status(400).json({
                success: false,
                error: "Please provide the confirm password",
                statusCode: 400
            });
        }

        const isPasswordMatch = await User.findMatchPassword(currentPassword, currentUser.password_hash);

        if (!isPasswordMatch) {
            return res.status(400).json({
                status: false,
                error: "The current password was incorrect.",
                statusCode: 400
            });
        }

        if (newPassword != confirmPassword) {
            return res.status(400).json({
                status: false,
                error: "The new password is not the same as confirm password.",
                statusCode: 400
            });
        }

        await User.updateNewPassword(userId, newPassword);

        return res.status(200).json({
            status: true,
            message: "Password has been chnaged successfully!",
            statusCode: 200
        });

    } catch (error) {
        console.error("Fail to change the new password: " + error);
        nxt(error);
    }
};

//Delete account: DELETE /api/auth/delete-account
export const deleteAccount = async(req, res, nxt) => {
    try {
        const userId = req.user.id;

        const currentUser = await User.findAcountById(userId);

        if (!currentUser) {
            return res.status(404).json({
                success: false,
                error: "No user found when delete the account.",
                statusCode: 404
            });
        }

        await User.deleteUserAccount(userId);

        return res.status(200).json({
            success: true,
            message: "Account deleted successfully.",
            statusCode: 200,
        });

    } catch (error) {
        console.error("Fail to delete account due to: " + error);
        NotepadText(error);
    }
}

