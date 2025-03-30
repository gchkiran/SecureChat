import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";
import { encryptMessage, importPublicKey, arrayBufferToBase64} from "../lib/encryptionUtils";
import {base64ToArrayBuffer, decryptMessage} from '../lib/decryptionUtils';
import getPrivateKey from '../lib/keyUtils.js';

export const useChatStore = create((set, get) => ({
    messages: [],
    users: [],
    selectedUser: null,
    isUsersLoading: false,
    isMessagesLoading: false,
  
    getUsers: async () => {
      set({ isUsersLoading: true });
      try {
        const res = await axiosInstance.get("/messages/users");
        set({ users: res.data });
      } catch (error) {
        console.log("Error in getUsers :", error.message);
        toast.error(error.message);
      } finally {
        set({ isUsersLoading: false });
      }
    },
    sendMessage: async (messageData) => {
      const { selectedUser, messages } = get();
      try {
        const publicKeyReceiver = selectedUser.publicKey;

        const publicKeySender = useAuthStore.getState().authUser.publicKey;

        const actualText = messageData.text;

        
        if(messageData.text){


          const importedPublicKeyReceiver = await importPublicKey(publicKeyReceiver);
          const receiverEncryptedMessage = await encryptMessage(messageData.text, importedPublicKeyReceiver);
          const receiverEncryptedMessageBase64 = arrayBufferToBase64(receiverEncryptedMessage);


          const importedPublicKeySender = await importPublicKey(publicKeySender);
          const senderEncryptedMessage = await encryptMessage(messageData.text, importedPublicKeySender);
          const senderEncryptedMessageBase64 = arrayBufferToBase64(senderEncryptedMessage);



          messageData.text = receiverEncryptedMessageBase64;
          messageData.encryptedTextReceiver = receiverEncryptedMessageBase64;
          messageData.encryptedTextSender = senderEncryptedMessageBase64;



        }
        const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
        
        res.data.text = actualText;
        set({ messages: [...messages, res.data] });


      } catch (error) {
        console.log("Error in sendMessages :", error.message);
        toast.error(error.message);
      }
    },
    subscribeToMessages: () => {
      const { selectedUser } = get();
      if (!selectedUser) return;
  
      const socket = useAuthStore.getState().socket;
  
      socket.on("newMessage", (newMessage) => {
        const isMessageSentFromSelectedUser = newMessage.senderId === selectedUser._id;
        if (!isMessageSentFromSelectedUser) return;
  
        newMessage.text = get().decryptMessageForUser(newMessage, newMessage.senderId);
        
        set({
          messages: [...get().messages, newMessage],
        });
      });
    },
    unsubscribeFromMessages: () => {
      const socket = useAuthStore.getState().socket;
      socket.off("newMessage");
    },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
        // Fetch the messages from the server
        const res = await axiosInstance.get(`/messages/${userId}`);
        
        // Decrypt the messages
        const decryptedMessages = await Promise.all(res.data.map(async (message) => {
            // Check if the message is encrypted
            if (message.encryptedTextReceiver || message.encryptedTextSender) {
                // Decrypt the message for the user
                const decryptedMessage = await get().decryptMessageForUser(message, userId);

                // Update the message text with the decrypted message
                message.text = decryptedMessage;
                return { ...message, decryptedMessage };
            } else {
                // If no encrypted message (just in case), return the message as is
                return message;
            }
        }));

        // Set the decrypted messages in the state
        set({ messages: decryptedMessages });
    } catch (error) {
        console.log("Error in getMessages:", error.message);
        toast.error(error.message);
    } finally {
        set({ isMessagesLoading: false });
    }
  },

  // Function to decrypt the message for the user
  decryptMessageForUser: async (message, userId) => {
  let encryptedMessageBase64;

  // Check if the message is for the current user and select the correct encrypted text
  if (message.receiverId == userId) {
      encryptedMessageBase64 = message.encryptedTextSender;
  } else {
      encryptedMessageBase64 = message.encryptedTextReceiver;
  }

  // Get the private key of the current user
  const privateKey = await getPrivateKey('user-passphrase');

  // Convert the Base64-encoded encrypted message to ArrayBuffer
  const encryptedMessage = base64ToArrayBuffer(encryptedMessageBase64);

  // Decrypt the message using the private key
  const decryptedMessage = await decryptMessage(encryptedMessage, privateKey);

  return decryptedMessage;  // Return the decrypted message
  },
    
  setSelectedUser: (selectedUser) => set({  selectedUser }),

}));