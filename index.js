import express from "express";
import bodyParser from "body-parser";
import {fileURLToPath} from "url";
import {config} from "dotenv";
import path from "path";
import mysql from "mysql";
import {v4} from "uuid";
import cookieParser from "cookie-parser";

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
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());

let connection = mysql.createPool({
    host: MYSQL_HOST, port: MYSQL_PORT, user: MYSQL_USER, password: MYSQL_PASSWORD, database: MYSQL_DATABSE
});

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

async function getPasswordByUsername(username) {
    return new Promise((resolve, reject) => {
        connection.query("SELECT u.password FROM itseclab.user AS u WHERE u.username =" + "'" + username + "'", [username], (err, rows, fields) => {
            if (err) return reject(err);
            resolve(rows);
        });
    });
}

app.get("/", async (req, res) => {
    let username = "";
    if (req.cookies) {
        const sessionToken = req.cookies["session_token"];
        const userSession = sessions[sessionToken];
        if (userSession != undefined) {
            username = userSession.username;
        }
    }
    await getPostsWithComments().then((posts) => {
        res.render("pages/index", {posts: posts, username: username});
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

    if (!req.cookies) {
        res.status(401).end();
        return;
    }

    // We can obtain the session token from the requests cookies, which come with every request
    const sessionToken = req.cookies["session_token"];
    if (!sessionToken) {
        // If the cookie is not set, return an unauthorized status
        res.status(401).end();
        return;
    }

    // We then get the session of the user from our session map
    // that we set in the signinHandler
    let userSession = sessions[sessionToken];
    if (!userSession) {
        // If the session token is not present in session map, return an unauthorized error
        res.status(401).end();
        return;
    }
    // if the session has expired, return an unauthorized error, and delete the
    // session from our map
    if (userSession.isExpired()) {
        delete sessions[sessionToken];
        res.status(401).end();
        return;
    }

    const content = req.body.content;
    const username = userSession.username;
    connection.query("INSERT INTO itseclab.post (content, post_userID)\n VALUES (?, (SELECT userID FROM user WHERE username LIKE ?));", [content, username], (err, rows, fields) => {
        if (err) throw err;
        res.redirect("/");
        res.status(200).end();
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
    if (!req.cookies) {
        res.status(401).end();
        return;
    }

    // We can obtain the session token from the requests cookies, which come with every request
    const sessionToken = req.cookies["session_token"];
    if (!sessionToken) {
        // If the cookie is not set, return an unauthorized status
        res.status(401).end();
        return;
    }

    // We then get the session of the user from our session map
    // that we set in the signinHandler
    let userSession = sessions[sessionToken];
    if (!userSession) {
        // If the session token is not present in session map, return an unauthorized error
        res.status(401).end();
        return;
    }
    // if the session has expired, return an unauthorized error, and delete the
    // session from our map
    if (userSession.isExpired()) {
        delete sessions[sessionToken];
        res.status(401).end();
        return;
    }

    const comment_postID = req.body.comment_postID;
    const content = req.body.content;
    const username = userSession.username;
    connection.query("INSERT INTO itseclab.comment(content, comment_userID, comment_postID) VALUES (?, (SELECT userID from user WHERE username = ?), ?);", [content, username, comment_postID], (err, rows, fields) => {
        if (err) throw err;
        res.redirect("/");
        res.status(200).end();
    });
});

// each session contains the username of the user and the time at which it expires
class Session {
    constructor(username, expiresAt) {
        this.username = username;
        this.expiresAt = expiresAt;
    }

    // we'll use this method later to determine if the session has expired
    isExpired() {
        this.expiresAt < (new Date());
    }
}

// this object stores the users sessions. For larger scale applications, you can use a database or cache for this purpose
const sessions = {};

app.post("/login", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    if (!username) {
        // If the username isn't present, return an HTTP unauthorized code
        res.status(401).end();
        return;
    }

    getPasswordByUsername(username).then((result) => {
        let expectedPassword = JSON.parse(JSON.stringify(result))[0].password;
        if (!expectedPassword || expectedPassword !== password) {
            res.status(401).end();
            return;
        }
        console.log("expectedPassword...", expectedPassword);
        const sessionToken = v4();
        console.log(sessionToken);
        const now = new Date();
        const expiresAt = new Date(+now + (60 * 60 * 24 * 7) * 1000);
        const session = new Session(username, expiresAt);
        sessions[sessionToken] = session;
        console.log("sessions", sessions);
        res.cookie("session_token", sessionToken, {expires: expiresAt});
        res.redirect("/");
        res.end();
    });
});

function checkCookie(cookie) {
    // We can obtain the session token from the requests cookies, which come with every request
    const sessionToken = cookie["session_token"];
    if (!sessionToken) {
        // If the cookie is not set, return an unauthorized status
        res.status(401).end();
        return;
    }

    // We then get the session of the user from our session map
    // that we set in the signinHandler
    let userSession = sessions[sessionToken];
    if (!userSession) {
        // If the session token is not present in session map, return an unauthorized error
        res.status(401).end();
        return;
    }
    // if the session has expired, return an unauthorized error, and delete the
    // session from our map
    if (userSession.isExpired()) {
        delete sessions[sessionToken];
        res.status(401).end();
        return;
    }
}

let server = app.listen(EXPRESS_PORT, EXPRESS_HOST, () => {
    console.log(`App listening on ${EXPRESS_HOST}:${EXPRESS_PORT}`);
});