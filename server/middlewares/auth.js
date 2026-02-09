import { clerkClient } from "@clerk/express";

export const auth = async (req, res, next) => {
  try {
    const { userId, has } = req.auth();

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // ✅ real clerk plan check
    const isPremium = has({ plan: "premium" });

    req.plan = isPremium ? "premium" : "free";

    const user = await clerkClient.users.getUser(userId);
    req.free_usage = user?.privateMetadata?.free_usage ?? 0;

    next();
  } catch (error) {
    console.log("Auth error:", error);
    return res.status(401).json({
      success: false,
      message: "Auth failed",
    });
  }
};
