import db from "../../../../db/db_config.js";

import { GoogleGenAI } from "@google/genai";


const createGEMINIClient = () => {
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }); 
};
const extractTotalTokenCount = (response) => {
  const usageMetadata = response?.usageMetadata || {};
  const exlicitTotal = Number(usageMetadata.totalTokenCount || 0);
  if (exlicitTotal > 0) {
    return exlicitTotal;
  }
  const prompTokens = Number(usageMetadata.promptTokenCount || 0);
  const candidateTokenCount = Number(usageMetadata.candidateTokenCount || 0);
  return prompTokens + candidateTokenCount;
};



// const DEFAULT_GEMINI_MODEL = "gemini-2.0-flash";
// const UNSUPPORTED_CHAT_MODELS = new Set(["gemini-1.5-pro"]);
// const configuredGeminiModel =
//   process.env.GEMINI_MODEL?.trim().replace(/^['"]|['"]$/g, "") || "";

// const GEMINI_MODEL =
//   configuredGeminiModel && !UNSUPPORTED_CHAT_MODELS.has(configuredGeminiModel)
//     ? configuredGeminiModel
//     : DEFAULT_GEMINI_MODEL;

// const GEMIN_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";



const GEMINI_MODEL = (
  process.env.GEMINI_MODEL || "gemini-2.0-flash"
)
  .trim()
  .replace(/^['"]|['"]$/g, "");
const genAIClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const getRecentConversationsServiceRows = async (limit = 5) => {
  const normalizedLimit = Number.parseInt(limit, 10);
  const safeLimit =
    Number.isNaN(normalizedLimit) || normalizedLimit <= 0
      ? 20
      : normalizedLimit;
  // LIMIT cannot use a prepared-statement placeholder on many MySQL versions (errno 1210).
  const [rows] = await db.execute(
    `SELECT id, role, content, created_at FROM conversations ORDER BY id DESC LIMIT ${safeLimit}`,
  );
  return rows.reverse();
};



const generateAssistantAnswer = async ({ historyRows = [], question }) => {
  const formattedHistory = (historyRows || []).map((row) => ({
    role: row.role === "assistant" ? "model" : "user",
    parts: [{ text: row.content }],
  }));

  const chat = genAIClient.chats.create({
    model: GEMINI_MODEL,
    config: { maxOutputTokens: 1024 },
    history: formattedHistory,
  });

  const result = await chat.sendMessage({ message: question });
  return {
    text: result?.text ?? "",
    totalTokens: extractTotalTokenCount(result),
  };
};

const getMessageById = async (messageId) => {
  const [rows] = await db.execute(
    "SELECT id, role, content, token_count, created_at FROM conversations WHERE id = ? LIMIT 1",
    [messageId],
  );
  if (!rows[0]) return null;
  return {
    id: rows[0].id,
    role: rows[0].role,
    content: rows[0].content,
    tokenCount: Number(rows[0].token_count || 0),
    createdAt: rows[0].created_at,
  };
};

// Feactches all conversations



// Validation

// export async function createConversationService(question) {
//   if (!question) {
//     const error = new Error("Question is required");
//     error.status = 400;
//     throw error;
//   }

//   const connection = await db.getConnection();
//   try {
//     await connection.beginTransaction();

//     const historyRows = await getRecentConversationsServiceRows(5);

//     const [userInsertResult] = await connection.execute(
//       'INSERT INTO conversations (role,content, token_count) VALUES ("user" , ? , ?)',
//       [question, 0],
//     );

//     let assistantText;
//     let totalTokens = 0;
//     try {
//       const assistantReply = await generateAssistantAnswer({
//         historyRows,
//         question,
//       });
//       assistantText = assistantReply.text;
//       totalTokens = assistantReply.totalTokens;
//     } catch (geminiError) {
//       console.error("Gemini request failed:", geminiError?.message || geminiError);
//       const err = new Error(
//         "Gemini request failed. Check GEMINI_API_KEY, GEMINI_MODEL, and API quota.",
//       );
//       err.status = 502;
//       throw err;
//     }

//     const [assistantInsertResult] = await connection.execute(
//       "INSERT INTO conversations (role, content, token_count) VALUES (?, ?, ?)",
//       ["assistant", assistantText, totalTokens],
//     );

//     await connection.commit();

//     const userConversation = await getMessageById(userInsertResult.insertId);
//     const assistantConversation = await getMessageById(
//       assistantInsertResult.insertId,
//     );

//     return {
//       userConversation: {
//         id: userConversation.id,
//         role: userConversation.role,
//         content: userConversation.content,
//       },
//       assistantConversation: {
//         id: assistantConversation.id,
//         role: assistantConversation.role,
//         content: assistantConversation.content,
//       },
//     };
//   } catch (error) {
//     try {
//       await connection.rollback();
//     } catch {
//       // ignore rollback errors
//     }
//     throw error;
//   } finally {
//     connection.release();
//   }
// }




export async function createConversationService(question) {
  if (!question) {
    const error = new Error("Question is required");
    error.status = 400;
    throw error;
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const historyRows = await getRecentConversationsServiceRows(5);

    const [userInsertResult] = await connection.execute(
      'INSERT INTO conversations (role,content, token_count) VALUES ("user" , ? , ?)',
      [question, 0],
    );

    let assistantText;
    let totalTokens = 0;
    try {
      const assistantReply = await generateAssistantAnswer({
        historyRows,
        question,
      });
      assistantText = assistantReply.text;
      totalTokens = assistantReply.totalTokens;
    } catch (geminiError) {
      console.error("Gemini request failed:", geminiError?.message || geminiError);
      const err = new Error(
        "Gemini request failed. Check GEMINI_API_KEY, GEMINI_MODEL, and API quota.",
      );
      err.status = 502;
      throw err;
    }

    const [assistantInsertResult] = await connection.execute(
      "INSERT INTO conversations (role, content, token_count) VALUES (?, ?, ?)",
      ["assistant", assistantText, totalTokens],
    );

    await connection.commit();

    const userConversation = await getMessageById(userInsertResult.insertId);
    const assistantConversation = await getMessageById(
      assistantInsertResult.insertId,
    );

    return {
      userConversation: {
        id: userConversation.id,
        role: userConversation.role,
        content: userConversation.content,
      },
      assistantConversation: {
        id: assistantConversation.id,
        role: assistantConversation.role,
        content: assistantConversation.content,
      },
    };
  } catch (error) {
    try {
      await connection.rollback();
    } catch {
      // ignore rollback errors
    }
    throw error;
  } finally {
    connection.release();
  }
}