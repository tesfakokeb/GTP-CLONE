

import express from "express";
import chatRouter from "./chat/chat.route.js";

const mainRouter = express.Router();



// /api/chat
mainRouter.use('/chat', chatRouter);

// mainRouter.use('/chat', (req, res) => {
//   res.send('chat api');
// });

export default mainRouter;


