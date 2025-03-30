import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true
        },
        fullName: {
            type: String,
            required: true,
        },
        password: {
            type: String,
            required: true,
            minLength: 6
        },
        profilePic: {
            type: String,
            default: "" 
        },
        publicKey: {
            n: { type: String, required: true },
            e: { type: String, required: true },
        },
        organization: {
            type: String,
            required: true
        },
        role: {
            type: String,
            enum: ['superadmin', 'admin', 'moderator', 'user', 'guest'],
            required: true,
            default: 'user'
        },
    },
    {timestamps: true}
);

const User = mongoose.model("User", userSchema);


export default User;