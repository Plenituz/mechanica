-- MySQL dump 10.16  Distrib 10.2.6-MariaDB, for Linux (x86_64)
--
-- Host: localhost    Database: mechanica_db
-- ------------------------------------------------------
-- Server version	10.2.6-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `discussion_messages`
--

DROP TABLE IF EXISTS `discussion_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `discussion_messages` (
  `discussion_message_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `content` text NOT NULL,
  `creator_id` int(10) unsigned DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `hosting_discussion` int(10) unsigned NOT NULL,
  PRIMARY KEY (`discussion_message_id`),
  KEY `ind_creator_id` (`creator_id`),
  KEY `ind_hosting_discussion` (`hosting_discussion`),
  CONSTRAINT `fk_discussion_messages_creator_id` FOREIGN KEY (`creator_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_discussion_messages_hosting_discussion` FOREIGN KEY (`hosting_discussion`) REFERENCES `discussions` (`discussion_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `discussion_messages`
--

LOCK TABLES `discussion_messages` WRITE;
/*!40000 ALTER TABLE `discussion_messages` DISABLE KEYS */;
/*!40000 ALTER TABLE `discussion_messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `discussions`
--

DROP TABLE IF EXISTS `discussions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `discussions` (
  `discussion_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `title` text NOT NULL,
  `creator_id` int(10) unsigned DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `hosting_repo` int(10) unsigned NOT NULL,
  PRIMARY KEY (`discussion_id`),
  KEY `ind_created_at` (`created_at`),
  KEY `ind_creator_id` (`creator_id`),
  KEY `ind_hosting_repo` (`hosting_repo`),
  CONSTRAINT `fk_discussion_creator_id` FOREIGN KEY (`creator_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_discussion_hosting_repo` FOREIGN KEY (`hosting_repo`) REFERENCES `repos` (`repo_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `discussions`
--

LOCK TABLES `discussions` WRITE;
/*!40000 ALTER TABLE `discussions` DISABLE KEYS */;
/*!40000 ALTER TABLE `discussions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `favorite_repos`
--

DROP TABLE IF EXISTS `favorite_repos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `favorite_repos` (
  `favorite_repo_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `favoriteur_id` int(10) unsigned DEFAULT NULL,
  `repo_id` int(10) unsigned DEFAULT NULL,
  `fav_datetime` datetime NOT NULL,
  PRIMARY KEY (`favorite_repo_id`),
  UNIQUE KEY `unik_repo_id_favoriteur_id` (`repo_id`,`favoriteur_id`),
  KEY `ind_favoriteur_id` (`favoriteur_id`),
  KEY `ind_repo_id` (`repo_id`),
  CONSTRAINT `fk_favorite_repos_favoriteur_id` FOREIGN KEY (`favoriteur_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_favorite_repos_repo_id` FOREIGN KEY (`repo_id`) REFERENCES `repos` (`repo_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `favorite_repos`
--

LOCK TABLES `favorite_repos` WRITE;
/*!40000 ALTER TABLE `favorite_repos` DISABLE KEYS */;
INSERT INTO `favorite_repos` VALUES (15,3,14,'2017-08-16 12:35:29'),(17,3,13,'2017-08-16 14:45:20');
/*!40000 ALTER TABLE `favorite_repos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `repos`
--

DROP TABLE IF EXISTS `repos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `repos` (
  `repo_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `admin_id` int(10) unsigned NOT NULL,
  `name` varchar(40) NOT NULL,
  `location` tinytext NOT NULL,
  `creation_date` date NOT NULL,
  `current_version` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`repo_id`),
  UNIQUE KEY `unik_admin_id_name` (`admin_id`,`name`),
  KEY `ind_admin_id` (`admin_id`),
  KEY `ind_repo_name` (`name`),
  CONSTRAINT `fk_repos_admin_id` FOREIGN KEY (`admin_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `repos`
--

LOCK TABLES `repos` WRITE;
/*!40000 ALTER TABLE `repos` DISABLE KEYS */;
INSERT INTO `repos` VALUES (13,3,'un','/media/sf_mechanica/data/userRepos/jeanno/un','2017-08-16',0),(14,3,'deux','/media/sf_mechanica/data/userRepos/jeanno/deux','2017-08-16',0),(15,3,'trois','/media/sf_mechanica/data/userRepos/jeanno/trois','2017-08-16',0),(16,3,'quatre','/media/sf_mechanica/data/userRepos/jeanno/quatre','2017-08-16',0),(17,3,'cinq','/media/sf_mechanica/data/userRepos/jeanno/cinq','2017-08-16',0),(18,3,'six','/media/sf_mechanica/data/userRepos/jeanno/six','2017-08-16',0),(19,3,'sept','/media/sf_mechanica/data/userRepos/jeanno/sept','2017-08-16',0);
/*!40000 ALTER TABLE `repos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sessions` (
  `session_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `expires` int(11) unsigned NOT NULL,
  `data` text CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  PRIMARY KEY (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
--

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
INSERT INTO `sessions` VALUES ('1nw1OMJfHjh6Si7vFsyQrzmwBAmLZdK1',1502974198,'{\"cookie\":{\"originalMaxAge\":null,\"expires\":null,\"secure\":true,\"httpOnly\":true,\"path\":\"/\"},\"passport\":{\"user\":{\"user_id\":3,\"name\":\"jeanno\",\"email\":\"jean@gmx.com\"}}}');
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `user_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(20) NOT NULL,
  `password` binary(60) NOT NULL,
  `email` varchar(254) NOT NULL,
  `creation_date` date NOT NULL,
  `description` text DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `ind_uni_name` (`name`),
  UNIQUE KEY `ind_uni_email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'user','$2a$10$gzD5RvCbBtkjHAMKAMcalOsu5QkkCcACuGT9GjD/bZSU1.gavp0nC','user@gmail.com','2017-07-21',NULL),(2,'user2','$2a$10$sPYt9k5gbN7G1Jv4ud0H4.qKPzo3hLN/D.5E8Y9Xj2Zb2HAuEkPo6','userr@gmail.Com','2017-07-21',NULL),(3,'jeanno','$2a$10$wfg4KbQcg9StTO1MX8Dm3eNiQy1rXjWqx.6QbINksgt6DbUm1mtIu','jean@gmx.com','2017-07-28',NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2017-08-16 15:00:28
