import React, { useEffect, useRef } from 'react';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from "../store/useAuthStore";
import MessageInput from './MessageInput';
import ChatHeader from './ChatHeader';
import MessageSkeleton from './skeletons/MessageSkeleton';
import { Download } from "lucide-react";
import { formatMessageTime } from '../lib/utils';



const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
  } = useChatStore();

  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);

  useEffect(() => {
    getMessages(selectedUser._id);

    console.log("Chat container " , authUser);

    subscribeToMessages();

    return () => unsubscribeFromMessages();
  }, [selectedUser._id, getMessages, subscribeToMessages, unsubscribeFromMessages, authUser]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleDownload = (fileUrl, fileType = "pdf") => {
    const link = document.createElement("a");
    const fileName = `file_${Date.now()}.${fileType}`;

    fetch(fileUrl)
      .then(response => response.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link); 
        window.URL.revokeObjectURL(url); 
      })
      .catch(err => {
        console.error("Error downloading the file:", err);
      });
  };
  if (isMessagesLoading){
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message._id}
            className={`chat ${message.senderId === authUser._id ? "chat-end" : "chat-start"}`}
            ref={messageEndRef}
          >
            <div className=" chat-image avatar">
              <div className="size-10 rounded-full border">
                <img
                  src={
                    message.senderId === authUser._id
                      ? authUser.profilePic || "/avatar.png"
                      : selectedUser.profilePic || "/avatar.png"
                  }
                  alt="profile pic"
                />
              </div>
            </div>
            <div className="chat-header mb-1">
              <time className="text-xs opacity-50 ml-1">
                {formatMessageTime(message.createdAt)}
              </time>
            </div>
            <div className="chat-bubble flex flex-col">
              {message.image && (
                <div className="relative">
                  <img
                    src={message.image}
                    alt="Attachment"
                    className="sm:max-w-[200px] rounded-md mb-2"
                  />
                  {/* Download Image Button */}
                  <button
                    onClick={() => handleDownload(message.image, "jpg")}
                    className="mt-2 p-2 bg-blue-500 text-white rounded hover:bg-blue-700"
                  >
                     <Download size={22} />
                  </button>
                </div>
                )}
              {message.pdf && (
                <div className="mt-2">
                  <iframe
                    src={`https://docs.google.com/gview?url=${message.pdf}&embedded=true`}
                    width="100%"
                    height="600px"
                    style={{ border: 'none' }}
                    title="PDF Preview"
                  />
                  <button
                    onClick={() => handleDownload(message.pdf, "pdf")}
                    className="mt-2 p-2 bg-blue-500 text-white rounded hover:bg-blue-700"
                  >
                    <Download size={22} />
                  </button>
                </div>
              )}
              {message.text && <p>{message.text}</p>}
            </div>
          </div>
        ))}
      </div>
      
      <MessageInput/>
     </div> 
  )
}

export default ChatContainer