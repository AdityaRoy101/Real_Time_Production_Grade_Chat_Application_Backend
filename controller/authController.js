import jwt from 'jsonwebtoken';
import UserSchema from '../server/models/mongo_collections/userModel.js';

const createToken = (_id, email, name) => {
    return jwt.sign({_id, email, name}, process.env.SECRET, { expiresIn: '3d' });
};

// login user
const loginUser = async(req, res) => {
    const {email, password} = req.body;

    try {
        const user = await UserSchema.login(email, password);

        // Creating a JWT Token
        const token = createToken(user._id, user.email, user.name);

        res.cookie('token', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: 3 * 24 * 60 * 60 * 1000
        }).status(200).json({
            message: `${user.name} logged in successfully`,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email
            },
            token: token
        });
    } catch (error) {
        res.status(200).json({ error: error.message });
    }
};

// signup user
const signupUser = async(req, res) => {
    const { name, email, password } = req.body;

    try {
        const user = await UserSchema.signup(name, email, password);

        // Creating a JWT Token
        const token = createToken(user._id, user.email, user.name);

        res.cookie('token', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: 3 * 24 * 60 * 60 * 1000
        }).status(201).json({ name, email, token });
    } catch (error) {
        res.status(200).json({ error: error.message });
    }
};

// JWT user
const JwtVerify = async(req, res) => {
    try {
        // First try to get token from cookies
        let token = req.cookies?.token;
        
        // If no token in cookies, check Authorization header
        if (!token && req.headers.authorization) {
            const authHeader = req.headers.authorization;
            if (authHeader.startsWith('Bearer ')) {
                token = authHeader.split(' ')[1];
            }
        }
        
        if (!token && req.query.token) {
            token = req.query.token;
        }
        
        if (!token && req.body && req.body.token) {
            token = req.body.token;
        }
        
        if (!token) {
            return res.status(401).json({ error: "Authentication required" });
        }
        
        const decoded = jwt.verify(token, process.env.SECRET);
        
        const user = await UserSchema.findById(decoded._id).select('_id name email');
        
        if (!user) {
            return res.status(401).json({ error: "User not found" });
        }
        
        if (!req.cookies?.token) {
            res.cookie('token', token, {
                httpOnly: true,
                secure: true,
                sameSite: 'none',
                maxAge: 3 * 24 * 60 * 60 * 1000
            });
        }
        
        res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email
        });
    } catch (error) {
        console.error("JWT Verification error:", error);
        res.status(401).json({ error: "Authentication failed" });
    }
};

export default {
    loginUser,
    signupUser,
    JwtVerify
};