import express from "express";
import bodyParser from "body-parser";
import {fileURLToPath} from "url";
import {config} from "dotenv";
import path from "path";
import mysql from "mysql";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({path: path.resolve(__dirname, "/.env")});

const EXPRESS_HOST = process.env.EXPRESS_HOST;
const EXPRESS_PORT = process.env.EXPRESS_PORT;
const MYSQL_HOST = process.env.MYSQL_HOST;
const MYSQL_PORT = process.env.MYSQL_PORT;
const MYSQL_USER = process.env.MYSQL_USER;
const MYSQL_PASSWORD = process.env.MYSQL_PASSWORD;
const MYSQL_DATABSE = process.env.MYSQL_DATABASE;

let app = express();
app.set("view engine", "ejs");
app.set("views", path.resolve(__dirname, "views"));
app.use(bodyParser.json());

let connection = mysql.createPool({
    host: MYSQL_HOST, port: MYSQL_PORT, user: MYSQL_USER, password: MYSQL_PASSWORD, database: MYSQL_DATABSE
});

// app.get("/", (req, res) => {
//     const username = req.query.username;
//     const password = req.query.password;
//     connection.query("SELECT username,password FROM user WHERE username =" + "'" + username + "'" + " AND password =" + "'" + password + "'", (err, rows, fields) => {
//         if (err) throw err;
//         res.send(rows);
//     });
// });

async function getPostsWithComments() {
    return new Promise(async (resolve, reject) => {
        connection.query("SELECT p.postID, p.content, p.post_userID, u.username FROM itseclab.post AS p JOIN itseclab.user AS u ON p.post_userID=u.userID; ", async (err, rows, fields) => {
            let postArray = [];
            if (err) return reject(err);
            for (let i = 0; i < rows.length; i++) {
                let post = JSON.parse(JSON.stringify(rows[i]));
                await getCommentsByPostId(post.postID).then((result) => {
                    post["comments"] = JSON.parse(JSON.stringify(result));
                    postArray.push(post);
                });
            }
            resolve(postArray);
        });
    });
}

async function getCommentsByPostId(postId) {
    return new Promise((resolve, reject) => {
        connection.query("SELECT c.commentID, c.comment_userID, c.comment_postID, c.content, u.username FROM itseclab.comment AS c JOIN itseclab.user AS u ON c.comment_userID=u.userID WHERE c.comment_postID=?;", [postId], (err, rows, fields) => {
            if (err) return reject(err);
            resolve(rows);
        });
    });
}

app.get("/", async (req, res) => {
    await getPostsWithComments().then((posts) => {
        res.render("pages/index", {posts: posts});
    });
});

app.get("/post", (req, res) => {
    connection.query("SELECT p.postID, p.content, p.post_userID, u.username FROM itseclab.post AS p JOIN itseclab.user AS u ON p.post_userID=u.userID; ", (err, rows, fields) => {
        if (err) throw err;
        // console.log("/posts...", rows);
        res.send(rows);
    });
});

app.post("/post/new", (req, res) => {
    const content = req.body.content;
    const username = req.body.username;
    connection.query("INSERT INTO itseclab.post (content, post_userID)\n VALUES (?, (SELECT userID FROM user WHERE username LIKE ?));", [content, username], (err, rows, fields) => {
        if (err) throw err;
        res.send("New post created.");
    });
});

app.get("/comment", (req, res) => {
    const postID = req.query.postid;
    connection.query("SELECT c.commentID, c.comment_userID, c.comment_postID, c.content, u.username FROM itseclab.comment AS c JOIN itseclab.user AS u ON c.comment_userID=u.userID WHERE c.comment_postID=?;", [postID], (err, rows, fields) => {
        if (err) throw err;
        // console.log("/posts...", rows);
        res.send(rows);
    });
});

app.post("/comment/new", (req, res) => {
    const comment_postID = req.body.comment_postID;
    const content = req.body.content;
    console.log("req.body", req.body);
    //username is saved in cookie
    const username = "mattias";
    connection.query("INSERT INTO itseclab.comment(content, comment_userID, comment_postID) VALUES (?, (SELECT userID from user WHERE username = ?), ?);", [content, username, comment_postID], (err, rows, fields) => {
        if (err) throw err;
        res.send("New comment created!");
    });
});


let server = app.listen(EXPRESS_PORT, EXPRESS_HOST, () => {
    console.log(`App listening on ${EXPRESS_HOST}:${EXPRESS_PORT}`);
});