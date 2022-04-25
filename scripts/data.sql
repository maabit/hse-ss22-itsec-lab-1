INSERT INTO itseclab.user (username, password)
VALUES ('Admin', '4dm1n');

INSERT INTO itseclab.user (username, password)
VALUES ('Mattias Abramovic', 'mattias');

INSERT INTO itseclab.user (username, password)
VALUES ('Nico Linder', 'nico');

INSERT INTO itseclab.post(content, post_userID)
VALUES ('Bet you wont find the super hidden administration Page.',
        (SELECT userID FROM user WHERE username LIKE 'Admin'));

INSERT INTO itseclab.post(content, post_userID)
VALUES ('This Blog is so cool!', (SELECT userID FROM user WHERE username LIKE 'Mattias Abramovic'));

INSERT INTO itseclab.post(content, post_userID)
VALUES ('The Admin does not use a secure password. ;)',
        (SELECT userID FROM user WHERE username LIKE 'Nico Linder'));

INSERT INTO itseclab.comment(content, comment_userID, comment_postID)
VALUES ('Bet!',
        (SELECT userID from user WHERE username LIKE 'Mattias Abramovic'),
        1);

INSERT INTO itseclab.comment(content, comment_userID, comment_postID)
VALUES ('I love this retro look.',
        (SELECT userID from user WHERE username LIKE 'Nico Linder'),
        2);

INSERT INTO itseclab.comment(content, comment_userID, comment_postID)
VALUES ('Dont tell everybody :(',
        (SELECT userID from user WHERE username LIKE 'Admin'),
        3);