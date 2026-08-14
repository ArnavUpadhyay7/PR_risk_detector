import mongoose, { Schema } from "mongoose";
const userSchema = new Schema({
    githubId: { type: String, required: true, unique: true, index: true },
    username: { type: String, required: true },
    avatarUrl: { type: String, required: true },
    email: { type: String },
    preferences: {
        type: Schema.Types.Mixed,
        default: {},
    },
}, { timestamps: true });
export const UserModel = mongoose.models.User ?? mongoose.model("User", userSchema);
//# sourceMappingURL=user.model.js.map