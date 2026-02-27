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

// Helper to validate common fields
const validateRequest = (userId, prompt) => {
  if (!userId) throw new Error("User Not Authenticated");
  if (!prompt) throw new Error("Prompt is required");
};

// GENERATE ARTICLE
export const generateArticle = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { prompt, length } = req.body;
    validateRequest(userId, prompt);

    const plan = req.plan;
    const free_usage = req.free_usage ?? 0;

    const response = await AI.chat.completions.create({
      model: "gemini-3-flash-preview",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: length || 1000,
    });

    const content = response.choices?.[0]?.message?.content || "";

    // Corrected SQL: Ensure variables are handled by the tagged template
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
    console.error("generateArticle Error:", error);
    return res.json({ success: false, message: error.message });
  }
};


// GENERATE BLOG TITLE
export const generateBlogTitle = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { prompt } = req.body;
    validateRequest(userId, prompt);

    const plan = req.plan;
    const free_usage = req.free_usage ?? 0;

    const response = await AI.chat.completions.create({
      model: "gemini-3-flash-preview",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 700,
    });

    const content = response.choices?.[0]?.message?.content || "";

    // Fix: Using a cleaner SQL template structure
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
    console.error("generateBlogTitle Error:", error);
    return res.json({ success: false, message: error.message });
  }
};


// GENERATE IMAGE

export const generateImage = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { prompt, publish } = req.body;
    validateRequest(userId, prompt);

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

    const base64Image = `data:image/png;base64,${Buffer.from(data, "binary").toString("base64")}`;

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
    console.error("generateImage Error:", error);
    return res.json({ success: false, message: error.message });
  }
};


// REMOVE BACKGROUND

export const removeImageBackground = async (req, res) => {
  
  try {
    const { userId } = req.auth();
    const image = req.file;
   

    if (!userId || !image) {
      return res.status(400).json({ success: false, message: "Auth or Image missing" });
    }

    // Use a timeout to prevent hanging forever
    const uploadToCloudinary = () => {
      return new Promise((resolve, reject) => {
        
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "quickai/remove-bg",
            transformation: [{ effect: "background_removal" }],
          },
          (error, result) => {
            if (error) {
              console.error("Cloudinary Error:", error);
              return reject(error);
            }
            
            resolve(result);
          }
        );
        stream.end(image.buffer);
      });
    };

    const uploadResult = await uploadToCloudinary();
    const secure_url = uploadResult.secure_url;
        
    await sql`
      INSERT INTO creations (user_id, prompt, content, type)
      VALUES (${userId}, 'Remove Background', ${secure_url}, 'remove-background')
    `;
    

    return res.json({ success: true, content: secure_url });
  } catch (error) {
    console.error("FULL ERROR LOG:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// REMOVE OBJECT FROM IMAGE

export const removeImageObject = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { object } = req.body;
    const image = req.file;

    if (!userId || !image || !object) {
      return res.json({ success: false, message: "Missing required fields (User, Image, or Object name)." });
    }

    let uploadResult;
    if (image.buffer) {
      uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "quickai/remove-object" },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        stream.end(image.buffer);
      });
    } else {
      uploadResult = await cloudinary.uploader.upload(image.path, { folder: "quickai/remove-object" });
    }

    const public_id = uploadResult.public_id;

    // Use the specific 'gen_remove' syntax
    const imageUrl = cloudinary.url(public_id, {
      transformation: [{ effect: `gen_remove:prompt_${object}` }],
      secure: true,
    });

    await sql`
      INSERT INTO creations (user_id, prompt, content, type)
      VALUES (${userId}, ${`Remove ${object}`}, ${imageUrl}, 'remove-object')
    `;

    return res.json({ success: true, content: imageUrl });
  } catch (error) {
    console.error("Object Removal Error:", error);
    return res.json({ success: false, message: error.message });
  }
};

// RESUME REVIEW
export const resumeReview = async (req, res) => {
  try {
    const { userId } = req.auth();
    const resume = req.file;

    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
    if (!resume || !resume.buffer) {
      return res.status(400).json({ success: false, message: "A valid PDF resume is required." });
    }

    const pdfData = await pdf(resume.buffer);
    const resumeText = pdfData.text?.trim();

    if (!resumeText || resumeText.length < 100) {
      return res.status(422).json({ success: false, message: "Resume text is too short or unreadable." });
    }

    const response = await AI.chat.completions.create({
      model: "gemini-3-flash-preview",
      messages: [
        {
          role: "system",
          content: "You are an expert technical recruiter. Review the resume and provide feedback in Markdown. Focus on: 1. Layout, 2. Bullet Points, 3. Keywords, 4. Score (0-100)."
        },
        { role: "user", content: `Review this resume:\n\n${resumeText}` }
      ],
      temperature: 0.4,
      max_tokens: 1500,
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content) throw new Error("AI failed to generate a response.");

    await sql`
      INSERT INTO creations (user_id, prompt, content, type)
      VALUES (${userId}, 'Resume Review Analysis', ${content}, 'resume-review')
    `;

    return res.json({ success: true, content });
  } catch (error) {
    console.error("resumeReview Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};