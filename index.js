import express from "express";
import bodyParser from "body-parser";
import {fileURLToPath} from "url";
import {config} from "dotenv";
import path from "path";
import mysql from "mysql";
import {v4} from "uuid";
import cookieParser from "cookie-parser";
import fetch from "node-fetch";

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
app.use(express.static(path.resolve(__dirname, "public")));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());

let connection = mysql.createPool({
    host: MYSQL_HOST, port: MYSQL_PORT, user: MYSQL_USER, password: MYSQL_PASSWORD, database: MYSQL_DATABSE
});

async function getUsers() {
    return new Promise((resolve, reject) => {
        let userArray = [];
        connection.query("SELECT * FROM itseclab.user", (err, rows) => {
            if (err) return reject(err);
            rows.forEach((element) => {
                let user = element;
                userArray.push(JSON.parse(JSON.stringify(user)));
            });
            resolve(userArray);
        });
    });
}

async function getPasswordByUsername(username) {
    return new Promise((resolve, reject) => {
        connection.query("SELECT u.password FROM itseclab.user AS u WHERE u.username =?", [username], (err, rows) => {
            if (err) return reject(err);
            let password;
            if (rows[0] != undefined) {
                password = JSON.parse(JSON.stringify(rows[0])).password;
            }
            resolve(password);
        });
    });
}


async function getPosts() {
    return new Promise((resolve, reject) => {
        connection.query("SELECT p.postID, p.content, p.post_userID, u.username FROM itseclab.post AS p JOIN itseclab.user AS u ON p.post_userID=u.userID; ", (err, rows) => {
            let postArray = [];
            if (err) return reject(err);
            rows.forEach((element) => {
                let post = JSON.parse(JSON.stringify(element));
                postArray.push(post);
            });
            resolve(postArray);
        });
    });
}

async function getCommentsByPostId(postId) {
    return new Promise((resolve, reject) => {
        let commentsArray = [];
        connection.query("SELECT c.commentID, c.comment_userID, c.comment_postID, c.content, u.username FROM itseclab.comment AS c JOIN itseclab.user AS u ON c.comment_userID=u.userID WHERE c.comment_postID=?;", [postId], (err, rows) => {
            if (err) return reject(err);
            rows.forEach((element) => {
                let comment = JSON.parse(JSON.stringify(element));
                commentsArray.push(comment);
            });
            resolve(commentsArray);
        });
    });
}

async function createPostsWithComments() {
    return new Promise(async (resolve, reject) => {
        await getPosts().then(async (posts) => {
            let postsWithCommentsArray = [];
            for (const post of posts) {
                await getCommentsByPostId(post.postID).then((comments) => {
                    post["comments"] = comments;
                    postsWithCommentsArray.push(post);
                });
            }
            resolve(postsWithCommentsArray);
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
    await createPostsWithComments().then((postsWithComments) => {
        res.render("simpleblog", {posts: postsWithComments, username: username});
        res.status(200).end();
    });
});

app.get("/administration", async (req, res) => {
    await getUsers().then((users) => {
        res.render("administration", {users: users});
        res.status(200).end();
    });
});


app.post("/user/new", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    connection.query("INSERT INTO itseclab.user (username, password) VALUES (?, ?) " + "ON DUPLICATE KEY UPDATE password=" + "'" + password + "'", [username, password], (err) => {
        if (err) {
            res.redirect("/administration");
            throw err;
        }

        res.status(200);
        res.redirect("/administration");
    });
});

app.get("/user/delete", (req, res) => {
    const userId = req.query.userID;
    connection.query("DELETE FROM itseclab.user WHERE userID=" + userId, (err) => {
        if (err) {
            res.redirect("/administration");
            throw err;
        }
        res.status(200);
        res.redirect("/administration");
    });
});

app.post("/post/new", (req, res) => {

    if (!req.cookies) {
        res.status(401);
        res.redirect("/");
        return;
    }

    const sessionToken = req.cookies["session_token"];
    if (!sessionToken) {
        res.status(401);
        res.redirect("/");
        return;
    }

    let userSession = sessions[sessionToken];
    if (!userSession) {
        res.status(401);
        res.redirect("/");
        return;
    }

    if (userSession.isExpired()) {
        delete sessions[sessionToken];
        res.status(401);
        res.redirect("/");
        return;
    }

    const content = req.body.content;
    const username = userSession.username;
    connection.query("INSERT INTO itseclab.post (content, post_userID)\n VALUES (?, (SELECT userID FROM user WHERE username LIKE ?));", [content, username], (err) => {
        if (err) throw err;
        res.status(200);
        res.redirect("/");
    });
});

app.post("/comment/new", (req, res) => {
    if (!req.cookies) {
        res.status(401);
        res.redirect("/");
        return;
    }

    const sessionToken = req.cookies["session_token"];
    if (!sessionToken) {
        res.status(401);
        res.redirect("/");
        return;
    }

    let userSession = sessions[sessionToken];
    if (!userSession) {
        res.status(401);
        res.redirect("/");
        return;
    }

    if (userSession.isExpired()) {
        delete sessions[sessionToken];
        res.status(401);
        res.redirect("/");
        return;
    }

    const comment_postID = req.body.comment_postID;
    const content = req.body.content;
    const username = userSession.username;
    connection.query("INSERT INTO itseclab.comment(content, comment_userID, comment_postID) VALUES (?, (SELECT userID from user WHERE username = ?), ?);", [content, username, comment_postID], (err) => {
        if (err) throw err;
        res.status(200);
        res.redirect("/");
    });
});

class Session {
    constructor(username, expiresAt) {
        this.username = username;
        this.expiresAt = expiresAt;
    }

    isExpired() {
        this.expiresAt < (new Date());
    }
}

const sessions = {};

app.post("/login", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    if (!username) {
        res.status(401);
        res.redirect("/");
        return;
    }

    getPasswordByUsername(username).then((expectedPassword) => {
        if (!expectedPassword || expectedPassword !== password) {
            res.redirect("/");
            res.status(401).end();
            return;
        }

        const sessionToken = v4();
        const now = new Date();
        const expiresAt = new Date(+now + (60 * 60 * 24 * 7) * 1000);
        const session = new Session(username, expiresAt);
        sessions[sessionToken] = session;
        res.cookie("session_token", sessionToken, {expires: expiresAt});
        res.redirect("/");
        res.status(200).end();
    });
});

app.post("/logout", (req, res) => {
    if (req.cookies) {
        const sessionToken = req.cookies["session_token"];
        const userSession = sessions[sessionToken];
        if (userSession != undefined) {
            delete sessions[sessionToken];
        }
    }
    res.status(200);
    res.redirect("/");
});

let server = app.listen(EXPRESS_PORT, EXPRESS_HOST, () => {
    console.log(`App listening on ${EXPRESS_HOST}:${EXPRESS_PORT}`);
});