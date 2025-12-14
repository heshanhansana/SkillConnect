const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const User = require("./models/User");
const Conversation = require("./models/Conversation");
const Message = require("./models/Message");
const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

app.use(express.json());
app.use(cors());

// ENVIRONMENT VARIABLES
// -------------------------------------
const PORT = process.env.PORT || 5000;
const MONGO_URL = process.env.MONGO_URL;

if (!MONGO_URL) {
    console.error("❌ Error: MONGO_URL is not defined in .env");
    process.exit(1);
}

// MongoDB CONNECTION
// -------------------------------------
mongoose
    .connect(MONGO_URL)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch((err) => console.error("❌ MongoDB Error:", err));

// SOCKET.IO CONNECTION HANDLING
const onlineUsers = new Map();

io.on("connection", (socket) => {
    console.log(" User connected:", socket.id);

    socket.on("user_online", (userId) => {
        onlineUsers.set(userId, socket.id);
        console.log(` User ${userId} is online`);
    });

    socket.on("join_conversation", (conversationId) => {
        socket.join(conversationId);
        console.log(` Socket ${socket.id} joined conversation ${conversationId}`);
    });

    socket.on("leave_conversation", (conversationId) => {
        socket.leave(conversationId);
    });

    socket.on("disconnect", () => {
        for (const [userId, socketId] of onlineUsers.entries()) {
            if (socketId === socket.id) {
                onlineUsers.delete(userId);
                break;
            }
        }
        console.log(" User disconnected:", socket.id);
    });
});

// CREATE ACCOUNT ROUTE
// -------------------------------------
app.post("/api/create-account", async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            email,
            username,
            role,
            department,
            password,
        } = req.body;

        const existingEmail = await User.findOne({ email });
        if (existingEmail) return res.json({ success: false, message: "Email already exists" });

        const existingUsername = await User.findOne({ username });
        if (existingUsername) return res.json({ success: false, message: "Username already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            firstName,
            lastName,
            email,
            username,
            role,
            department,
            password: hashedPassword,
        });

        await newUser.save();

        res.json({ success: true, message: "Account created successfully" });

    } catch (error) {
        console.error("Create Account Error:", error);
        res.json({ success: false, message: "Server error" });
    }
});

// LOGIN ROUTE
// -------------------------------------
app.post("/api/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.json({ success: false, message: "Invalid email or password" });

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) return res.json({ success: false, message: "Invalid email or password" });

        res.json({
            success: true,
            message: "Login successful",
            user: {
                id: user._id,
                name: user.firstName + " " + user.lastName,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        console.error("Login Error:", error);
        res.json({ success: false, message: "Server error" });
    }
});


// MESSAGING API ROUTES

app.get("/api/users", async (req, res) => {
    try {
        const users = await User.find({}, "firstName lastName email _id role department");
        res.json({ success: true, users });
    } catch (error) {
        console.error("Get Users Error:", error);
        res.json({ success: false, message: "Server error" });
    }
});

app.get("/api/users/:id", async (req, res) => {
    try {
        const user = await User.findById(req.params.id, "firstName lastName email _id role department");
        if (!user) return res.json({ success: false, message: "User not found" });
        res.json({ success: true, user });
    } catch (error) {
        console.error("Get User Error:", error);
        res.json({ success: false, message: "Server error" });
    }
});

app.post("/api/conversations", async (req, res) => {
    try {
        const { participant1, participant2 } = req.body;

        let conversation = await Conversation.findOne({
            participants: { $all: [participant1, participant2] },
        }).populate("participants", "firstName lastName email");

        if (!conversation) {
           
            conversation = new Conversation({
                participants: [participant1, participant2],
            });
            await conversation.save();
            
            conversation = await Conversation.findById(conversation._id)
                .populate("participants", "firstName lastName email");
        }

        res.json({ success: true, conversation });
    } catch (error) {
        console.error("Create Conversation Error:", error);
        res.json({ success: false, message: "Server error" });
    }
});

app.get("/api/conversations/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        const conversations = await Conversation.find({
            participants: userId,
        })
            .populate("participants", "firstName lastName email")
            .sort({ lastMessageTime: -1 });

        res.json({ success: true, conversations });
    } catch (error) {
        console.error("Get Conversations Error:", error);
        res.json({ success: false, message: "Server error" });
    }
});

app.get("/api/messages/:conversationId", async (req, res) => {
    try {
        const { conversationId } = req.params;

        const messages = await Message.find({ conversationId })
            .populate("senderId", "firstName lastName")
            .sort({ createdAt: 1 });

        res.json({ success: true, messages });
    } catch (error) {
        console.error("Get Messages Error:", error);
        res.json({ success: false, message: "Server error" });
    }
});

app.post("/api/messages", async (req, res) => {
    try {
        const { conversationId, senderId, text } = req.body;

        const message = new Message({
            conversationId,
            senderId,
            text,
        });
        await message.save();

        const populatedMessage = await Message.findById(message._id)
            .populate("senderId", "firstName lastName");

        await Conversation.findByIdAndUpdate(conversationId, {
            lastMessage: text,
            lastMessageTime: new Date(),
        });

        // Emit the message to all users in the conversation room
        io.to(conversationId).emit("new_message", populatedMessage);

        res.json({ success: true, message: populatedMessage });
    } catch (error) {
        console.error("Send Message Error:", error);
        res.json({ success: false, message: "Server error" });
    }
});

// START SERVER
// -------------------------------------
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
