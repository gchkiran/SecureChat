import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import { io } from "../lib/socket.js";
import { getReceiverSocketId } from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
  try {
      const loggedInUserId = req.user._id;      
      const filteredUsers = await User.find({ 
          _id: { $ne: loggedInUserId }, 
          organization: req.user.organization
      }).select('-password');

      res.status(200).json(filteredUsers);

  } catch (error) {
      console.log("Error in getUsersForSidebar ", error.message);
      res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getMessages = async (req, res) => {
    try {
      const { id: userToChatId } = req.params;
      const myId = req.user._id;
  
      const messages = await Message.find({
        $or: [
          // TODO:: Fix this.
          { senderId: myId, receiverId: userToChatId },
          { senderId: userToChatId, receiverId: myId },
        ],
      });
  
      res.status(200).json(messages);
    } catch (error) {
      console.log("Error in getMessages controller: ", error.message);
      res.status(500).json({ error: "Internal server error" });
    }
  };

export const sendMessage = async (req, res) => {
    try{
        const {text, image, encryptedTextSender, encryptedTextReceiver, pdf} = req.body;
        const {id: receiverId} = req.params;
        const senderId = req.user._id;

        let imageUrl, pdfUrl;
        if(image){
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
        }
        if (pdf) {
          const uploadResponse = await cloudinary.uploader.upload(pdf, { resource_type: 'raw' });
          pdfUrl = uploadResponse.secure_url;
        }

        const newMessage = await Message.create({
            senderId,
            receiverId,
            text,
            encryptedTextSender,
            encryptedTextReceiver,
            image: imageUrl,
            pdf: pdfUrl

        });

        await newMessage.save();

        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("newMessage", newMessage);
        }    

        res.status(201).json(newMessage);
    }
    catch(error){
        console.log("Error in sendMessage controller ", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};