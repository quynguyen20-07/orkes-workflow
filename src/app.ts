import express from "express";
import path from "path";
import routes from "./routes";

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true })); // Parse form data

app.use("/", routes);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Portal đang chạy tại: http://localhost:${PORT}`);
});
