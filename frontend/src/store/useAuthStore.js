import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import { generateKeyPair } from "../lib/keyUtils.js";

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:5001" : "/";

export const useAuthStore = create((set, get) => ({
    
    authUser: null,
    publicKey: null,
    privateKey: null,
    isSigningUp: false,
    isLoggingIn: false, 
    isUpdatingProfile: false,
    isCheckingAuth: true,
    onlineUsers: [],

    setKeys: (publicKey, privateKey) => {
      set({ publicKey, privateKey });
    },

    checkAuth: async () => {
        try{
            const res = await axiosInstance.get("/auth/check");
            set({authUser: res.data})
            get().connectSocket()
        }
        catch(error){
            console.log("Error in checkAuth ", error.message);
            set({authUser: null})
        }
        finally{
            set({isCheckingAuth: false})
        }
    },

    signup: async (data) => {
        set({ isSigningUp: true });
        try {
          const res = await axiosInstance.post("/auth/signup", data);
          set({ authUser: res.data });
          toast.success("Account created successfully");
          get().connectSocket()

        } catch (error) {
            console.log("Error in signup ", error.message);
            toast.error(error.message);
        } finally {
          set({ isSigningUp: false });
        }
    },

    login: async (data) => {
        set({ isLoggingIn: true });
        try {
          const res = await axiosInstance.post("/auth/login", data);
          set({ authUser: res.data, publicKey: res.data.publicKey});

          console.log(res.data);


          const { publicKey, privateKey } = await generateKeyPair(data.email);
          get().setKeys(publicKey, privateKey);

          
          toast.success("Logged in successfully");

          get().connectSocket();

        } catch (error) {
            console.log("Error in login ", error.message);
            toast.error(error.message);
        } finally {
          set({ isLoggingIn: false });
        }
    },

    logout: async () => {
        try {
          await axiosInstance.post("/auth/logout");
          set({ authUser: null });
          toast.success("Logged out successfully");
          get().disconnectSocket();
        } catch (error) {
            console.log("Error in logout ", error.message);
            toast.error(error.message);
        }
      },
    
    updateProfile: async (data) => {
        set({ isUpdatingProfile: true });
        try {
          const res = await axiosInstance.put("/auth/update/profile", data);
          set({ authUser: res.data });
          toast.success("Profile updated successfully");
        } catch (error) {
          console.log("Error in update profile:", error.message);
          toast.error(error.message);
        } finally {
          set({ isUpdatingProfile: false });
        }
      },

      connectSocket: () => {
        const {authUser} = get();
        if (!authUser || get().socket?.connected) return;

        const socket = io(BASE_URL, {
          query: {
            userId: authUser._id,
          },
        });
        socket.connect();
        set({ socket: socket });

        socket.on("getOnlineUsers", (userIds) => {
          set({ onlineUsers: userIds });
        });
      },

      disconnectSocket: () => {
        if (get().socket?.connected) get().socket.disconnect();
      }
}));