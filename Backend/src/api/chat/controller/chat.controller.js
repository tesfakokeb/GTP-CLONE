import {
  createConversationService,
  getRecentConversationsServiceRows,
} from "../service/chat.service.js";

import { GoogleGenAI } from "@google/genai";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

const geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// const createGenAIClient = () => {
//   if (!process.env.GEMINI_API_KEY) {
//     throw new Error("GEMINI_API_KEY environment variable is required");
//   }
//   return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
// };

// async function main() {
//   const response = await geminiClient.models.generateContent({
//     model: 'gemini-3-flash-preview',
//     contents: 'explain how AI works in simple terms',
//   });
//   console.log(response.text);
// }
// // main();

export async function createConversationsController(req, res, next) {
  try {
    const body = req.body || {};
    const question = body.question ?? body.questions;

    if (!question || (typeof question === "string" && !question.trim())) {
      return res.status(400).json({
        success: false,
        message: "Missing required field: question",
      });
    }

    const result = await createConversationService(
      Array.isArray(question) ? question.join("\n") : question,
    );
    res.status(201).json({
      success: true,
      message: "Conversation created successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}


// export async function createConversationsController(req, res) {
//   try {
//     const body = req.body || {};
//     const rawQuestions = body.questions ?? body.question;
//     const questions = Array.isArray(rawQuestions)
//       ? rawQuestions.join("\n")
//       : rawQuestions;

//     if (!questions) {
//       return res
//         .status(400)
//         .json({
//           success: false,
//           error: "Missing required field: question or questions",
//         });
//     }

//     const result = await createConversationService(questions);
//     res.status(201).json({
//       success: true,
//       message: "Conversation created successfully",
//       data: result,
//     });
//   } catch (error) {
//     throw error;
//   }
// }

// async function createConversationsController(req, res) {
//   try {
//     const body = req.body || {};
//     const rawQuestions = body.questions ?? body.question;
//     const questions = Array.isArray(rawQuestions)
//       ? rawQuestions.join("\n")
//       : rawQuestions;

//     if (!questions) {
//       return res.status(400).json({
//         success: false,
//         error: "Missing required field: question or questions",
//       });
//     }

//     console.log(body);

//     const result = await createConversationService(questions);
//     res.status(201).json({
//       success: true,
//       message: "Conversation created successfully",
//       data: result,
//     });
//   } catch (error) {
//     throw error;
//   }
// }

export async function getConversationsController(req, res, next) {
  try {
    const rows = await getRecentConversationsServiceRows(50);
    const conversations = rows.map((row) => ({
      id: row.id,
      role: row.role,
      content: row.content,
    }));
    res.status(200).json({
      success: true,
      message: "Conversations retrieved successfully",
      data: { conversations },
    });
  } catch (error) {
    next(error);
  }
}

// export { createConversationsController, getConversationsController };
