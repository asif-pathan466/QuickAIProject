import express from "express";
import cors from "cors";
import "dotenv/config";
import { clerkMiddleware, requireAuth } from "@clerk/express";
import aiRouter from "./routes/aiRoute.js";
import connectClodinary from "./configs/cloudinary.js";
import userRouter from "./routes/userRoute.js";

const app = express();
await connectClodinary();

app.use(cors());
app.use(express.json());
app.use(clerkMiddleware());

app.get("/", (req, res) => {
  res.send("hello world");
});

// app.get("/debug-plan", requireAuth(), async (req, res) => {
//   const { userId, has } = req.auth();

//   res.json({
//     userId,
//     primium: has({ plan: "primium" }),
//     free: has({ plan: "Free" }),
//   });
// });


// protect only this route
app.use(requireAuth());

app.use("/api/ai", aiRouter);
app.use("/api/user", userRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
