import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import validator from 'validator';
const Schema = mongoose.Schema;

// User Schema Definition
const userSchema = new Schema({
    name: {
        type: String,
        required: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    password: {
        type: String,
        required: true,
    },
    online: {
        type: Boolean,
        default: false
    },
    lastActive: {
        type: Date,
        default: Date.now
    },
    avatar: {
        type: String,
        default: ""
    },
    friends: [{
        type: Schema.Types.ObjectId,
        ref: 'UserSchema'
    }]
}, { timestamps: true });

// static signup method
userSchema.statics.signup = async function(name, email, password) {
    
    // Email and Password Validation
    if(!name || !email || !password){
        throw Error("All fields must be filled");
    }
    if(!validator.isEmail(email)){
        throw Error("Email is not Valid");
    }
    if(!validator.isStrongPassword(password)){
        throw Error("Password is not strong enough");
    }

    const exists = await this.findOne({ email });

    if(exists){
        throw Error('Email already in use');
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const user = await this.create({ name, email, password: hash });

    return user;
};

// Static Login Method
userSchema.statics.login = async function(email, password){

    // Email and Password Validation
    if(!email || !password){
        throw Error("All fields must be filled");
    }

    const user = await this.findOne({ email });

    if(!user){
        throw Error("Incorrect Email");
    }

    // Password Matching
    const match = await bcrypt.compare(password, user.password);

    if(!match){
        throw Error("Incorrect Password");
    }

    return user;
};

// Added a method to update user's online status
userSchema.statics.updateOnlineStatus = async function(userId, status) {
    return this.findByIdAndUpdate(
        userId,
        { 
            online: status, 
            lastActive: status ? undefined : Date.now() 
        },
        { new: true }
    );
};

const UserSchema = mongoose.model('UserSchema', userSchema);
export default UserSchema;