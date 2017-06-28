var mysql = require('mysql');
var connection = mysql.createConnection({
	host:'localHost',
	user:'root',
	password:'toor',
	database:'test'
});
connection.connect();

connection.query('CREATE DATABASE IF NOT EXISTS nom_db CHARACTER SET "utf8";',
function(err, rows, field){
	if(!err)
		console.log('the solution is: ', rows, field);
	else
		console.log('error while performing query:', err);
});

connection.query('USE nom_db;',
function(err, rows, field){
	if(!err)
		console.log('the solution is: ', rows, field);
	else
		console.log('error while performing query:', err);
});


var createTableQuery = 
`CREATE TABLE IF NOT EXISTS Animal (
    id SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    espece VARCHAR(40) NOT NULL,
    sexe CHAR(1),
    date_naissance DATETIME NOT NULL,
    nom VARCHAR(30),
    commentaires TEXT,
    PRIMARY KEY (id)
)
ENGINE=INNODB;`
connection.query(createTableQuery,
function(err, rows, field){
	if(!err)
		console.log('the solution is: ', rows, field);
	else
		console.log('error while performing query:', err);
});

connection.query('SELECT * FROM animal',
function(err, rows, field){
	if(!err)
		console.log('the solution is: ', rows, field);
	else
		console.log('error while performing query:', err);
});

connection.end();
//https://codeforgeek.com/2015/01/nodejs-mysql-tutorial/

/*
CREATE DATABASE IF NOT EXISTS nom_db CHARACTER SET 'utf8';
to delete :
DROP DATABASE elevage;

CREATE TABLE IF NOT EXISTS Animal (
    id SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    espece VARCHAR(40) NOT NULL,
    sexe CHAR(1),
    date_naissance DATETIME NOT NULL,
    nom VARCHAR(30),
    commentaires TEXT,
    PRIMARY KEY (id)
)
ENGINE=INNODB;

//modifie 
ALTER TABLE nom_table ADD [COLUMN] nom_colonne description_colonne(CHAR(1), NOT NULL etc);
ALTER TABLE Test_tuto DROP COLUMN date_insertion;
exemples:
ALTER TABLE Test_tuto 

CHANGE prenom nom VARCHAR(30) NOT NULL; -- Changement du type + changement du nom
ALTER TABLE Test_tuto CHANGE id id BIGINT NOT NULL; -- Changement du type sans renommer
ALTER TABLE Test_tuto MODIFY id BIGINT NOT NULL AUTO_INCREMENT; -- Ajout de l'auto-incrémentation
ALTER TABLE Test_tuto MODIFY nom VARCHAR(30) NOT NULL DEFAULT 'Blabla'; -- Changement de la description (même type mais ajout d'une valeur par défaut)

INSERT INTO Animal VALUES (1, 'chien', 'M', '2010-04-05 13:43:00', 'Rox', 'Mordille beaucoup');
INSERT INTO Animal VALUES (2, 'chat', NULL, '2010-03-24 02:23:00', 'Roucky', NULL);

sur le suivant : la valeur de la colonne "id" est mise a NULL, techniquement pas valide mais comme
on a mit AUTO_INCREMENT mariadb va automatiquement mettre une valeur 
INSERT INTO Animal VALUES (NULL , 'chat', 'F', '2010-09-13 15:02:00', 'Schtroumpfette', NULL);

insertion avec nom de colonnes
INSERT INTO Animal (espece, sexe, date_naissance) 
    VALUES ('tortue', 'F', '2009-08-03 05:12:00');
	
INSERT INTO Animal (nom, commentaires, date_naissance, espece) 
    VALUES ('Choupi', 'Né sans oreille gauche', '2010-10-03 16:44:00', 'chat');
	
INSERT INTO Animal (espece, date_naissance, commentaires, nom, sexe) 
    VALUES ('tortue', '2009-06-13 08:17:00', 'Carapace bizarre', 'Bobosse', 'F');
	
plusieurs lignes a la fois :
INSERT INTO Animal (espece, sexe, date_naissance, nom) 
	VALUES ('chien', 'F', '2008-12-06 05:18:00', 'Caroline'),
		   ('chat', 'M', '2008-09-11 15:38:00', 'Bagherra'),
		   ('tortue', NULL, '2010-08-23 05:18:00', NULL);
syntax specifique a mysql et ses forks (marche avec mariadb)
on evite de l'utiliser car c'est pas général et donc si un jour on change de db ca pue
INSERT INTO Animal 
	SET nom='Bobo', espece='chien', sexe='M', date_naissance='2010-07-21 15:41:00';

Index : 
tri des colonnes du tableau pour acces plus rapide, mais ralenti les requetes d'insertion suppression modification, il y a differents types :
UNIQUE : ajoute la contrainte sur les colonnes choisis : 
deux lignes ne pourrons pas avoir la meme combinaisons de valeur pour les colonnes choisis
FULLTEXT: recherche hyper rapide sur les colonnes de type text, mais perd l'habilit de faire une recherche sur plusieurs 
colonnes, (pour la recuperer faudrait créer plusieurs index FULLTEXT)

    CONSTRAINT fk_client_numero          -- On donne un nom à notre clé
        FOREIGN KEY (client)             -- Colonne sur laquelle on crée la clé
        REFERENCES Client(numero) 
		
SELECT Espece.description 
FROM Espece 
INNER JOIN Animal 
    ON Espece.id = Animal.espece_id 
WHERE Animal.nom = 'Cartouche';

SELECT Animal.nom AS nom_animal, Race.nom AS race
FROM Animal
INNER JOIN Race
    ON Animal.race_id = Race.id
WHERE Animal.espece_id = 2             -- ceci correspond aux chats
ORDER BY Race.nom, Animal.nom;

SELECT Animal.nom AS nom_animal, Race.nom AS race
FROM Animal                         -- Table de gauche
LEFT OUTER JOIN Race                -- Table de droite
    ON Animal.race_id = Race.id
WHERE Animal.espece_id = 2
    AND Animal.nom LIKE 'C%'
ORDER BY Race.nom, Animal.nom;

SELECT Animal.nom AS nom_animal, Race.nom AS race

FROM Animal                                              -- Table de gauche
RIGHT OUTER JOIN Race                                    -- Table de droite
    ON Animal.race_id = Race.id
WHERE Race.espece_id = 2
ORDER BY Race.nom, Animal.nom;

SELECT *
FROM table1
[INNER | LEFT | RIGHT] JOIN table2 USING (colonneJ);  -- colonneJ est présente dans les deux tables
-- équivalent à 
SELECT *
FROM table1
[INNER | LEFT | RIGHT] JOIN table2 ON Table1.colonneJ = table2.colonneJ;

SELECT MIN(date_naissance)
FROM (
    SELECT Animal.id, Animal.sexe, Animal.date_naissance, Animal.nom, Animal.espece_id, 
            Espece.id AS espece_espece_id         -- On renomme la colonne id de Espece, donc il n'y a plus de doublons.
    FROM Animal                                   -- Attention de ne pas la renommer espece_id, puisqu'on sélectionne aussi la colonne espece_id dans Animal !
    INNER JOIN Espece
        ON Espece.id = Animal.espece_id
    WHERE sexe = 'F'
    AND Espece.nom_courant IN ('Tortue d''Hermann', 'Perroquet amazone')
) AS tortues_perroquets_F;

SELECT id, sexe, nom, espece_id, race_id 
FROM Animal
WHERE (id, race_id) = (
    SELECT id, espece_id
    FROM Race
    WHERE id = 7);
*/