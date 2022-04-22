INSERT INTO itseclab.user (username, password)
VALUES ('admin', 'admin');

INSERT INTO itseclab.user (username, password)
VALUES ('mattias', 'mattias');

INSERT INTO itseclab.user (username, password)
VALUES ('nico', 'nico');


INSERT INTO itseclab.post(content, post_userID)
VALUES ('Hello this is a Post from admin', (SELECT userID FROM user WHERE username LIKE 'admin'));

INSERT INTO itseclab.post(content, post_userID)
VALUES ('Hello this is a Post from mattias', (SELECT userID FROM user WHERE username LIKE 'mattias'));

INSERT INTO itseclab.post(content, post_userID)
VALUES ('Hello this is a Post from nico',
        (SELECT userID FROM user WHERE username LIKE 'nico'));

INSERT INTO itseclab.comment(content, comment_userID, comment_postID)
VALUES ('This is a comment from mattias on admin post',
        (SELECT userID from user WHERE username LIKE 'mattias'),
        1);

INSERT INTO itseclab.comment(content, comment_userID, comment_postID)
VALUES ('This is a comment from nico on mattias post',
        (SELECT userID from user WHERE username LIKE 'nico'),
        2);

INSERT INTO itseclab.comment(content, comment_userID, comment_postID)
VALUES ('This is a comment from admin on nico post',
        (SELECT userID from user WHERE username LIKE 'admin'),
        3);