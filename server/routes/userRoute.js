import express from "express";
import {
  getPublishCreations,
  getUserCreations,
  toggleLikeCreaton,
} from "../controllers/userController.js";
import { auth } from "../middlewares/auth.js";

const userRouter = express.Router();

userRouter.get("/get-user-creations", auth, getUserCreations);
userRouter.get("/get-published-creations", auth, getPublishCreations);

// ✅ best: send creationId in body OR params
userRouter.post("/toggle-like-creations", auth, toggleLikeCreaton);

export default userRouter;
