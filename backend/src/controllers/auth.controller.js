import User from "../models/user.model.js";
import bcrypt from 'bcryptjs'
import {generateToken} from '../lib/utils.js';
import cloudinary from '../lib/cloudinary.js'

export const signup = async (req, res) => {
    const {fullName, email, password, publicKey, organization} = req.body;
   try{
    if(!fullName || !email || !password || !organization){
        return res.status(400).json({message: "Please fill in all fields"});
    }
    if(password.length < 6){
        return res.status(400).json({message: 'Password must be at least 6 characters'});
    }

    const user = await User.findOne({email})

    if(user) return res.status(400).json({message: 'Email already exists'});

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const { n, e } = publicKey;

    const newUser = new User({
        fullName,
        email,
        password: hashedPassword,
        publicKey: {
            n,
            e
        },
        organization,
        role: 'user'
    })

    if(newUser){
        // generate jwt token
        generateToken(newUser._id, res)
        await newUser.save();

        res.status(201).json({
            _id : newUser._id,
            fullName: newUser.fullName,
            email: newUser.email,
            profilepic: newUser.profilePic,
            publicKey: newUser.publicKey,
            organization: newUser.organization,
            role: newUser.role,
        });
    }else{
        res.status(400).json({message: "Invalid User Data"});
    }

   }
   catch(error){
    console.log("Error in signup controller", error.message);
    res.status(500).json({message: "Internal Server Error"});
   }
};
export const login = async (req, res) => {
    const {email, password} = req.body;
    try {
        const user = await User.findOne({email});

        if(!user){
            return res.status(400).json({message: 'Invalid credentials'});
        }
        
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if(!isPasswordCorrect){
            return res.status(400).json({message: 'Invalid credentials'});
        }

        generateToken(user._id, res);

        res.status(200).json({
            _id : user._id,
            email: user.email,
            fullName: user.fullName,
            profilePic: user.profilePic,
            createdAt: user.createdAt,
            publicKey: user.publicKey,
            organization: user.organization
        })

    }
    catch(error){
        console.log("Error in login controller", error.message);
        res.status(500).json({message: "Internal Server Error"});
    }
};
export const logout = (req, res) => {
    try{
        res.cookie("jwt", "", {maxAge: "0"});
        res.status(200).json({message: "Logged out successfully"});

    } catch(error){
        console.log("Error in logout controller", error.message);
        res.status(500).json({message: "Internal Server Error"});
    }
   
};

export const updateProfile = async (req, res) => {
    try {
      const { profilePic } = req.body;
      const userId = req.user._id;
  
      if (!profilePic) {
        return res.status(400).json({ message: "Profile pic is required" });
      }
  
      const uploadResponse = await cloudinary.uploader.upload(profilePic);
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { profilePic: uploadResponse.secure_url },
        { new: true }
      );
  
      res.status(200).json(updatedUser);
    } catch (error) {
      console.log("error in update profile:", error.message);
      res.status(500).json({ message: "Internal server error" });
    }
};

export const checkAuth = (req, res) => {
    try {
      res.status(200).json(req.user);
    } catch (error) {
      console.log("Error in checkAuth controller", error.message);
      res.status(500).json({ message: "Internal Server Error" });
    }
};