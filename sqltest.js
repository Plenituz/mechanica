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


*/