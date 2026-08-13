import mongoose from "mongoose";
export async function connectDB() {
    const uri = process.env.MONGODB_URI ?? process.env.MONGO_URI;
    if (!uri) {
        console.warn("MongoDB URI not configured — persistence disabled.");
        return;
    }
    try {
        await mongoose.connect(uri);
        console.log("MongoDB connected");
    }
    catch (error) {
        console.warn("MongoDB connection failed — continuing without persistence:", error);
    }
}
//# sourceMappingURL=db.js.map