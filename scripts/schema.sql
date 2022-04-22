-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS = @@UNIQUE_CHECKS, UNIQUE_CHECKS = 0;
SET @OLD_FOREIGN_KEY_CHECKS = @@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS = 0;
SET @OLD_SQL_MODE = @@SQL_MODE, SQL_MODE =
        'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema itseclab
-- -----------------------------------------------------
DROP SCHEMA IF EXISTS `itseclab`;

-- -----------------------------------------------------
-- Schema itseclab
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `itseclab` DEFAULT CHARACTER SET utf8;
USE `itseclab`;

-- -----------------------------------------------------
-- Table `itseclab`.`user`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `itseclab`.`user`;

CREATE TABLE IF NOT EXISTS `itseclab`.`user`
(
    `userID`   INT         NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(45) NOT NULL,
    `password` VARCHAR(45) NOT NULL,
    PRIMARY KEY (`userID`),
    UNIQUE INDEX `userID_UNIQUE` (`userID` ASC) VISIBLE,
    UNIQUE INDEX `username_UNIQUE` (`username` ASC) VISIBLE
)
    ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `itseclab`.`post`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `itseclab`.`post`;

CREATE TABLE IF NOT EXISTS `itseclab`.`post`
(
    `postID`      INT          NOT NULL AUTO_INCREMENT,
    `content`     VARCHAR(256) NOT NULL,
    `post_userID` INT          NOT NULL,
    PRIMARY KEY (`postID`),
    UNIQUE INDEX `postID_UNIQUE` (`postID` ASC) VISIBLE,
    INDEX `fk_post_user_idx` (`post_userID` ASC) VISIBLE,
    CONSTRAINT `fk_post_user`
        FOREIGN KEY (`post_userID`)
            REFERENCES `itseclab`.`user` (`userID`)
            ON DELETE NO ACTION
            ON UPDATE NO ACTION
)
    ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `itseclab`.`comment`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `itseclab`.`comment`;

CREATE TABLE IF NOT EXISTS `itseclab`.`comment`
(
    `commentID`      INT          NOT NULL AUTO_INCREMENT,
    `content`        VARCHAR(255) NOT NULL,
    `comment_userID` INT          NOT NULL,
    `comment_postID` INT          NOT NULL,
    PRIMARY KEY (`commentID`),
    UNIQUE INDEX `commentID_UNIQUE` (`commentID` ASC) VISIBLE,
    INDEX `fk_comment_user_idx` (`comment_userID` ASC) VISIBLE,
    INDEX `fk_comment_post_idx` (`comment_postID` ASC) VISIBLE,
    CONSTRAINT `fk_comment_user1`
        FOREIGN KEY (`comment_userID`)
            REFERENCES `itseclab`.`user` (`userID`)
            ON DELETE NO ACTION
            ON UPDATE NO ACTION,
    CONSTRAINT `fk_comment_post1`
        FOREIGN KEY (`comment_postID`)
            REFERENCES `itseclab`.`post` (`postID`)
            ON DELETE NO ACTION
            ON UPDATE NO ACTION
)
    ENGINE = InnoDB;


SET SQL_MODE = @OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS = @OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS = @OLD_UNIQUE_CHECKS;
