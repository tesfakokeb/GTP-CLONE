import "dotenv/config";

import express from "express";
import db from "./db/db_config.js";

import cors from "cors";

import { corsOptions } from "./src/config/cors.config.js";
import { errorHandler } from "./src/middleware/error.handler.js";

import mainRouter from "./src/api/main.routes.js";

const app = express();

app.use(cors(corsOptions));
app.use(express.json());

app.use("/api", mainRouter);

// Final middleware for handling errors
app.use(errorHandler);

async function startServer() {
  try {
    const connection = await db.getConnection();
    console.log('db conected');
    connection.release();

    app.listen(2000, (err) => {
      if (err) {
        console.log(err);
      } else {
        console.log("Server is running on http://localhost:2000");
      }
    });
  } catch (error) {
    console.error("Failed to start the server:", error);
  }
}


startServer();

// app.listen(2000, () => {
//   console.log("Server is running on http://localhost:2000");
// });

// function logger(req, res, next) {
//   const url = req.url;
//   const method = req.method;

//   console.log(url, method);

//   next();
// }

// function loggerSecond(req, res, next) {
//   console.log(req.url, req.method);

//   next();
// }

// app.get("/", logger, (req, res) => {
//   res.send("Hello World");
// });

// app.get("/about", logger, (req, res) => {
//   res.send("Hello World! from about route");
// });

// app.get("/api/chat", logger, (req, res) => {
//   res.send("Hello World! from chat route");
// });

// app.get("/api/conversation", (req, res) => {
//   res.send("Hello World! from conversation route");
// });
