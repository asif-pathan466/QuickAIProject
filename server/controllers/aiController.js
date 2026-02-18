import OpenAI from "openai";
import sql from "../configs/db.js";
import { clerkClient } from "@clerk/express";
import axios from "axios";
import { v2 as cloudinary } from "cloudinary";
import FormData from "form-data";
import pdf from 'pdf-parse-fork'

const AI = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});


// GENERATE ARTICLE

export const generateArticle = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { prompt, length } = req.body;

    const plan = req.plan;
    const free_usage = req.free_usage ?? 0;
    //  && free_usage >= 10

    // if (plan !== "premium") {
    //   return res.json({
    //     success: false,
    //     message: "Limit reached. Upgrade to continue.",
    //   });
    // }

    const response = await AI.chat.completions.create({
      model: "gemini-3-flash-preview",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: length,
    });

    const content = response.choices?.[0]?.message?.content || "";

    await sql`
      INSERT INTO creations (user_id, prompt, content, type)
      VALUES (${userId}, ${prompt}, ${content}, 'article')
    `;

    if (plan !== "premium") {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: { free_usage: free_usage + 1 },
      });
    }

    return res.json({ success: true, content });
  } catch (error) {
    console.log("generateArticle Error:", error);
    return res.json({ success: false, message: error.message });
  }
};


// GENERATE BLOG TITLE

export const generateBlogTitle = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { prompt } = req.body;

    const plan = req.plan;
    const free_usage = req.free_usage ?? 0;
    //  && free_usage >= 10

    // if (plan !== "premium") {
    //   return res.json({
    //     success: false,
    //     message: "Limit reached. Upgrade to continue.",
    //   });
    // }

    const response = await AI.chat.completions.create({
      model: "gemini-3-flash-preview",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 700,
    });

    const content = response.choices?.[0]?.message?.content || "";

    await sql`
      INSERT INTO creations (user_id, prompt, content, type)
      VALUES (${userId}, ${prompt}, ${content}, 'blog-title')
    `;

    if (plan !== "premium") {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: { free_usage: free_usage + 1 },
      });
    }

    return res.json({ success: true, content });
  } catch (error) {
    console.log("generateBlogTitle Error:", error);
    return res.json({ success: false, message: error.message });
  }
};


// GENERATE IMAGE

export const generateImage = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { prompt, publish } = req.body;

    const plan = req.plan;

    // if (plan !== "premium") {
    //   return res.json({
    //     success: false,
    //     message: "This feature is only available for premium subscriptions",
    //   });
    // }

    // convert publish to boolean
    const publishValue = publish === true || publish === "true";

    const formData = new FormData();
    formData.append("prompt", prompt);

    const { data } = await axios.post(
      "https://clipdrop-api.co/text-to-image/v1",
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          "x-api-key": process.env.CLIPDROP_API_KEY,
        },
        responseType: "arraybuffer",
      }
    );

    const base64Image = `data:image/png;base64,${Buffer.from(
      data,
      "binary"
    ).toString("base64")}`;

    const uploadRes = await cloudinary.uploader.upload(base64Image, {
      folder: "quickai/generated",
    });

    const secure_url = uploadRes.secure_url;

    await sql`
     INSERT INTO creations (user_id, prompt, content, type, publish)
     VALUES (${userId}, ${prompt}, ${secure_url}, 'image', ${publishValue})
     `;

    return res.json({ success: true, content: secure_url });
  } catch (error) {
    console.log("generateImage Error:", error);
    return res.json({ success: false, message: error.message });
  }
};


// REMOVE BACKGROUND

export const removeImageBackground = async (req, res) => {
  try {
    const { userId } = req.auth();
    const image = req.file;
    const plan = req.plan;

    // if (plan !== "premium") {
    //   return res.json({
    //     success: false,
    //     message: "This feature is only available for premium subscriptions",
    //   });
    // }

    if (!image) {
      return res.json({ success: false, message: "Image file is required." });
    }

    // If multer memoryStorage => image.buffer exists
    // If multer diskStorage => image.path exists
    let secure_url = "";

    if (image.buffer) {
      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "quickai/remove-bg",
            resource_type: "image",
            transformation: [{ effect: "background_removal" }],
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );

        stream.end(image.buffer);
      });

      secure_url = uploadResult.secure_url;
    } else if (image.path) {
      const uploadResult = await cloudinary.uploader.upload(image.path, {
        folder: "quickai/remove-bg",
        resource_type: "image",
        transformation: [{ effect: "background_removal" }],
      });

      secure_url = uploadResult.secure_url;
    } else {
      return res.json({
        success: false,
        message: "Image data missing. Check multer config.",
      });
    }

    await sql`
      INSERT INTO creations (user_id, prompt, content, type)
      VALUES (${userId}, 'Remove Background from image', ${secure_url}, 'remove-background')
    `;

    return res.json({ success: true, content: secure_url });
  } catch (error) {
    console.log("removeImageBackground Error:", error);
    return res.json({ success: false, message: error.message });
  }
};


// REMOVE OBJECT FROM IMAGE

export const removeImageObject = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { object } = req.body;
    const image = req.file;
    const plan = req.plan;

    // if (plan !== "premium") {
    //   return res.json({
    //     success: false,
    //     message: "This feature is only available for premium subscriptions",
    //   });
    // }

    if (!image) {
      return res.json({ success: false, message: "Image file is required." });
    }

    if (!object) {
      return res.json({ success: false, message: "Object name is required." });
    }

    let uploadResult;

    if (image.buffer) {
      uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "quickai/remove-object",
            resource_type: "image",
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );

        stream.end(image.buffer);
      });
    } else {
      uploadResult = await cloudinary.uploader.upload(image.path, {
        folder: "quickai/remove-object",
      });
    }

    const public_id = uploadResult.public_id;

    const imageUrl = cloudinary.url(public_id, {
      transformation: [{ effect: `gen_remove:${object}` }],
      resource_type: "image",
    });

    await sql`
      INSERT INTO creations (user_id, prompt, content, type)
      VALUES (${userId}, ${`Remove ${object} from image`}, ${imageUrl}, 'remove-object')
    `;

    return res.json({ success: true, content: imageUrl });
  } catch (error) {
    console.log("removeImageObject Error:", error);
    return res.json({ success: false, message: error.message });
  }
};

export const resumeReview = async (req, res) => {
  try {
    const { userId } = req.auth();
    const resume = req.file;

    // 1. Validate File Existence
    if (!resume || !resume.buffer) {
      return res.status(400).json({ success: false, message: "A valid PDF resume is required." });
    }

    // 2. Check Usage Limits (ADDED 'await' here)
    // const { isAllowed, plan, free_usage } = await checkUsage(userId);
    // if (!isAllowed) {
    //   return res.status(403).json({ success: false, message: "Limit reached. Upgrade to continue." });
    // }

    // 3. Extract Text
    const pdfData = await pdf(resume.buffer);
    const resumeText = pdfData.text?.trim();

    if (!resumeText || resumeText.length < 100) {
      return res.status(422).json({ success: false, message: "Resume text is too short or unreadable." });
    }

    // 4. AI Analysis
    const response = await AI.chat.completions.create({
      model: "gemini-3-flash-preview",
      messages: [
        {
          role: "system",
          content: "You are an expert technical recruiter. Review the resume and provide feedback in Markdown format. Focus on: 1. Visual Layout, 2. Impact of Bullet Points (STAR method), 3. Skill Keywords, and 4. Final Score (0-100)."
        },
        { role: "user", content: `Review this resume:\n\n${resumeText}` }
      ],
      temperature: 0.4,
      max_tokens: 1500,
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content) throw new Error("AI failed to generate a response.");

    // 5. Database & Usage
    await sql`
  INSERT INTO creations (user_id, prompt, content, type)
  VALUES (${userId}, 'Resume Review Analysis', ${content}, 'resume-review')
`;

    // await incrementUsage(userId, plan, free_usage);

    return res.json({ success: true, content });

  } catch (error) {
    console.error("resumeReview Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};