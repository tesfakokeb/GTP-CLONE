import express from "express";
const chatRouter = express.Router();

import {createConversationsController, getConversationsController} from "./controller/chat.controller.js";

// /api/chat/conversations

// chatRouter.post("/conversations", (req, res) => {
//   res.send('post api method for creating a new conversation');
// });

chatRouter.post("/conversations", createConversationsController);


// chatRouter.get("/conversations", (req, res) => {
//   res.send('Get api method for retrieving conversations');
// });

chatRouter.get("/conversations", getConversationsController);



export default chatRouter;
