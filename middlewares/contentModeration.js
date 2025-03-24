import axios from "axios";
import fs from "fs";

export const moderateContent = async (req, res, next) => {
  const GEMINI_API_URL = process.env.GEMINI_API_URL;
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const text = req.body?.postContent; // User's input text

  try {
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: `Analyze the following text and determine if it contains inappropriate content:\n\n"${text}"\n\nReply with "Safe" if the content is appropriate, or "Inappropriate" if it contains hate speech, vulgarity, threats, or explicit material.`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.0, // Ensures consistent AI responses
          maxOutputTokens: 10,
        },
      }
    );

    const aiResponse =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (aiResponse && aiResponse.toLowerCase().includes("inappropriate")) {
      return res
        .status(400)
        .json({ message: "Your post contains inappropriate content." });
    }

    next(); // If the content is clean, proceed
  } catch (error) {
    console.error(
      "Error communicating with Gemini API:",
      error.response?.data || error.message
    );
    res.status(500).json({ message: "Error checking content" });
  }
};

export const moderateImages = async (req, res, next) => {
  const GEMINI_IMAGE_API_URL = process.env.GEMINI_API_URL;
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: "No images uploaded." });
  }

  try {
    // Convert images to base64 and send them for moderation
    const requests = req.files.map((file) => {
      const imageBuffer = fs.readFileSync(file.path).toString("base64");

      return axios.post(`${GEMINI_IMAGE_API_URL}?key=${GEMINI_API_KEY}`, {
        contents: [
          {
            parts: [
              {
                text: "Analyze the following image and determine if it contains inappropriate content such as animal abuse, graphic violence, or explicit material. Reply with 'Safe' or 'Inappropriate' only.",
              },
              { inlineData: { mimeType: file.mimetype, data: imageBuffer } },
            ],
          },
        ],
      });
    });

    // Wait for all API requests
    const responses = await Promise.all(requests);

    // Check responses
    for (let i = 0; i < responses.length; i++) {
      const aiResponse =
        responses[i].data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (aiResponse && aiResponse.toLowerCase().includes("inappropriate")) {
        fs.unlinkSync(req.files[i].path); // Delete flagged images
        return res.status(400).json({
          message: "One or more images contain inappropriate content.",
        });
      }
    }

    next();
  } catch (error) {
    console.error(
      "🚨 Error communicating with Gemini API:",
      error.response?.data || error.message
    );
    res.status(500).json({ message: "Error checking image content." });
  }
};
