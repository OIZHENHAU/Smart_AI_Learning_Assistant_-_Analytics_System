import jwt from "jsonwebtoken";
import User from "../models/User.js";

const ALLOWED_ROLES = ['student', 'lecturer', 'parents', 'admin'];

function generateUserToken(id) {
    return jwt.sign({id}, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || "1d"
    });
}

export const register = async(req, res, nxt) => {
    try {
        const {username, email, password, phoneNumber, role} = req.body;
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
        const safeRole = ALLOWED_ROLES.includes(role) ? role : 'student';
        const userId = await User.create({username, email, password, phone_number: phoneNumber, role: safeRole});
        const createdUser = await User.findAcountById(userId);

        //Generate token
        const token = generateUserToken(userId);

        res.status(200).json({
            success: true,
            data: {
                user: {
                    id: userId,
                    username: username,
                    email: email,
                    phonenumber: phoneNumber,
                    role: safeRole,
                    status: createdUser.status
                },
                token,
            },
            message: createdUser.status === 'pending'
                ? "Account created. Waiting for the admin approval."
                : "User registered successfully."
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

        if (validUser.status === 'pending') {
            return res.status(403).json({
                success: false,
                accountStatus: 'pending',
                error: "Your account is still waiting for admin approval.",
                statusCode: 403
            });
        }

        if (validUser.status === 'deactivated') {
            return res.status(403).json({
                success: false,
                accountStatus: 'deactivated',
                error: 'Your account has been activated. Please contact an admin.',
                statusCode: 403
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
                    phoneNumber: validUser.phone_number,
                    role: validUser.role
                }
            },
            token,
            message: "Login successful."
        });

    } catch (error) {
        console.error("Login failed due to: " + error);
        nxt(error);
    }

};

//Get all trhe users for admin: GET /api/auth/admin/users
export const getAllUsersForAdmin = async (req, res, next) => {
    try {
        const users = await User.getAllUsers();
        res.status(200).json({
            success: true,
            data: users,
            statusCode: 200
        });

    } catch (error) {
        console.error("Fail to get all the users for admin due to: " + error);
        next(error);
    }
};

//Approve the users permission: POST /api/auth/admin/users/:id/approve
export const approveUserAccount = async (req, res, next) => {
    try {
        const { id } = req.params;
        await User.setUserStatus(id, 'active');
        res.status(200).json({
            success: true,
            message: "User approved successfully.",
            statusCode: 200
        });

    } catch (error) {
        console.error("Fail to approve the user due to: " + error);
        next(error);
    }
};

//Deactivate the user account: POST /api/auth/admin/users/:id/deactivate
export const deactivateUserAccount = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({
                success: false,
                error: "You cannot deactivate your own account.",
                statusCode: 400
            });
        }
        await User.setUserStatus(id, 'deactivated');

        res.status(200).json({
            success: true,
            message: "User deactivated successfully.",
            statusCode: 200
        });

    } catch (error) {
        console.error("Fail to deactivate the user due to: " + error);
        next(error);
    }
};

//Delete the user from the user management list: DELETE /api/auth/admin/users/:id
export const adminDeleteUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({
                success: false,
                error: "You cannot delete your own account.",
                statusCode: 400
            });
        }

        const deleted = await User.deleteUserAccount(id);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                error: "User was not found.",
                statusCode: 404
            })
        }

        res.status(200).json({
            success: true,
            message: "User deleted successfully.",
            statusCode: 200
        });

    } catch (error) {
        console.error("Fail to delete the user (admin) due to: " + error);
        next(error);
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
                role: currentUser.role,
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

        //Role is intentionally left untouched here - this endpoint is for the user's own
        //profile details, not self-promotion. Role changes should go through a separate admin-only flow.
        await User.updateUserProfile(userId, {
            username: username || currentUser.username,
            email: email || currentUser.email,
            phone_number: phoneNumber || currentUser.phone_number,
            role: currentUser.role
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
        nxt(error);
    }
}

