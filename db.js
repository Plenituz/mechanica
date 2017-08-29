const mysql = require('mysql');
const Q = require('q');
const convert = require('./fileConvert.js');
const path = require('path');
const fs = require('fs');
const mkdirp = require('mkdirp');
const bcrypt = require('bcrypt');
const fs_extra = require('fs-extra');

//fields
const saltRounds = 10;
const userReposPath = path.join(__dirname, "data", "userRepos");
const sqlFilesPath = path.join(__dirname, "sql");
const sqlCache = {};
const pool = mysql.createPool({
    connectionLimit: 100,
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'mechanica_db',
    debug: false
});

//adding string.format function, can't remember why tho, may be delete this and hope nothing breaks ?
if (!String.prototype.format) {
    String.prototype.format = function () {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function (match, number) {
            return typeof args[number] != 'undefined'
                ? args[number]
                : match
                ;
        });
    };
}

/*
    use the mysql escape function to escape all parameters prepended by '@' ex: @animalName

    text is the text of the sql request with the @<name>
    params is an object, each property of this object will be used
        to determine what to escape in the text

    returns the text escaped

    ex:
    "SELECT id WHERE name=@name", {name: "bob"} => "SELECT id WHERE name='bob'"
*/
function escapeText(text, params) {
    let res = text;
    for (prop in params) {
        res = res.replace('@' + prop, mysql.escape(params[prop]));
    }
    return res;
}

/*
    escape the parameters in the data and send the query
*/
function escapeAndSend(data, params) {
    data = escapeText(data, params);
    let queries = data.split(";");
    //clean the array of empty entries
    queries = queries.filter((q) => q.trim().length > 0);
    //if there is only one query, we limit the overhead by calling query and not queryMulti
    if (queries.length == 1)
        return query(queries[0]);
    else
        return queryMulti(queries);
}

function query(queryStr, params) {
    var deferred = Q.defer();

    pool.getConnection(function (err, connection) {

        function onError(err) {
            //res.status(100).send("error in connection to data base after");
            connection.removeListener('error', onError);
            connection.release();
            deferred.reject(err);
            return;
        }

        if (err) {
            deferred.reject(err);
            //res.status(100).send("error in connection to database");
            return;
        }

        //console.log("connected as id " + connection.threadId);
        let q = connection.query(queryStr, params, function (err, results, fields) {
            connection.release();
            connection.removeListener('error', onError);
            if (!err) {
                //console.log("resolving " + connection.threadId);
                deferred.resolve(results, fields);
            } else {
                deferred.reject(err);
            }
        });
        if (process.env.DEBUG_SQL == true)
            console.log("query: " + q.sql);

        connection.on('error', onError);
    });

    return deferred.promise;
}

/*
    execute the given queryStr with the given params and return a promise

    supports parameters with the '?' notation but not the '@' notation
    ex:
    "SELECT id WHERE name=?"

    the connection won't be closed
*/
function queryWithConnection(connection, queryStr, params) {
    var deferred = Q.defer();

    if (process.env.DEBUG_SQL == true) console.log("next query: (params=" + params + ")\n" + queryStr);
    connection.query(queryStr, params, function (err, results, fields) {
        if (err)
            deferred.reject(err);
        else
            deferred.resolve(results, fields);
    });

    return deferred.promise;
}

/*
    Execute all the given queries in a row one after another and return the promise

    queries is an array of string

    returns a promise

    the connection won't be closed
*/
function multiQueryUnsafeWithConnection(connection, queries) {
    var promise = null;

    //using let here so the ref to i is not the same every loop
    for (let i = 0; i < queries.length; i++) {
        if (!promise) {
            promise = queryWithConnection(connection, queries[i]);
        } else {
            promise = promise.then(function (results, fields) {
                return queryWithConnection(connection, queries[i]);
            });
        }
    }
    return promise;
}

/*
    executes multiple queries, only if no error occurs. if an error occurs the queries are rolled back
    note that some query execute a commit therefore prevent the roll back see https://dev.mysql.com/doc/refman/5.5/en/implicit-commit.html

    expects an array of string, no parameter management

    returns a promise 
*/
function queryMulti(queries) {
    var defer = Q.defer();

    pool.getConnection(function (err, connection) {
        //fields for storing results and fields
        var res, fie;
        if (err) {
            defer.reject(err);
            return;
        }

        //handle all the errors : rollback and reject the promise
        function onError(err) {
            console.log("error occured: " + err);
            connection.rollback(function () {
                connection.release();
                defer.reject(err);
            })
        }

        connection.beginTransaction(function (err) {
            if (err) {
                onError(err);
                return;
            }

            //execute all but the last query
            multiQueryUnsafeWithConnection(connection, queries.slice(0, queries.length - 1))
                .then(function () {
                    //last query, we return the result
                    let q = queries[queries.length - 1];
                    return queryWithConnection(connection, q);
                })
                .then(function (results, fields) {
                    res = results;
                    fie = fields;
                    // return Q.nfcall(connection.commit);
                    return queryWithConnection(connection, "COMMIT");
                })
                .then(function () {
                    defer.resolve(res, fie);
                })
                .fail(function (err) {
                    onError(err);
                })
        });
    });

    return defer.promise;
}
    

/*
    read a file found in sqlFilePath and use it's content as a (potentially) multi query
    the text can have variables marked by '@', all properties of the params object will be used
    to replace the variables name by the property value
    "SELECT id WHERE name=@name", {name: "bob"} => "SELECT id WHERE name='bob'"

    all the queries should be separated by ';', unless their is only one of them
    WARNING don't put ';' in your comments it'll fuck shit up
*/
function queryFile(fileName, params) {
    //remove any extension if their is one and replace it with .sql
    //that way you can do queryFile('poop.sql') and queryFile('poop')
    fileName = path.parse(fileName).name + ".sql";
    if (fileName in sqlCache) {
        //file has already been read
        let data = sqlCache[fileName];
        return escapeAndSend(data, params);
    } else {
        return Q.nfcall(fs.readFile, path.join(sqlFilesPath, fileName), 'utf8')
            .then(function (data) {
                //store the queries in the cache
                sqlCache[fileName] = data;
                return escapeAndSend(data, params);
            });
    }
}

module.exports = {
    /*
        Create the DB tables and columns ONLY IF THEY ARE NOT ALREADY CREATED
        This function does NOT drop the tables

        if you want to reset the DB, you have to manually drop the tables before calling this
        better safe than sorry
    */
    initDB: function () {
        return queryFile("InitDB")
            .fail(function (err) {
                console.log("error while creating tables: " + err);
            });
	},

    /*
        create a user in the database.
        This can fail if:
            - the username already exists in the db
            - the email already exists in the db

        password needs to be plain text

        this returns a promise that will have the newly created user's id as parameter
    */
	createUser : function(name, password, email){
		//check if the user exists, if it doesn't create it
        return doesEmailExists(email)
            .then(function (exists) {
                if (exists) {
                    throw new SyntaxError("Email address " + email + " already exists");
                } else {
                    return doesUserExists(name);
                }
            })
            .then(function (exists) {
                if (exists) {
                    throw new SyntaxError("user " + name + " already exists");
                } else {
                    //safe to insert the new user, hashing the password for storage
                    return bcrypt.hash(password, saltRounds);
                }
            })
            .then(function (hash) {
                return queryFile("CreateUser", { name: name, hash: hash, email: email });
            })
            .then(function (results) {
                return results[0].created_user_id;
            });
	},

    /*
        this creates a repo in the database and the associated folder in data
        this can fail if:
            - the given adminName doesn't exist
            - the admin already has a repo with the same name

        this returns a promise with no parameter
    */
	createRepo : function(adminName, repoName){		
        return doesUserExists(adminName)
            .then(function (exists) {
                if (!exists) {
                    throw new Error("can't create repo " + repoName + ", user " + adminName + " doesn't exists");
                } else {
                    console.log("checking repo existance");
                    return doesRepoExists(adminName, repoName);
                }
            })
            .then(function (repoExists) {
                if (repoExists) {
                    throw new Error("can't create repo " + repoName + ", user " + adminName + " already has a repo with that name");
                } else {
                    //create all the folders to current version
                    return Q.nfcall(mkdirp, path.join(userReposPath, adminName, repoName, "current"));
                }
            })
            .then(function () {
                //only save the root location (not the current version folder)
                let location = path.join(userReposPath, adminName, repoName);

                return queryFile("CreateRepo", { adminName: adminName, repoName: repoName, location: location });
            });
    },

    /*
        remove a repo from the database and from the data folder
        note the db is only updated if the folder was deleted succesfully

        this returns a promise with no parameter
    */
    deleteRepo: function (adminName, repoName) {
        return module.exports.getRepoLocation(adminName, repoName)
            //remove the folder
            .spread(function (repo_id, repoLocation, current_version) {
                return Q.nfcall(fs_extra.remove, repoLocation);
            })
            //remove the repo from the database
            .then(function () {
                return queryFile("DeleteRepo", { repoName: repoName, adminName: adminName });
            });
    },

    /*
        create a message in the discussion given. If the discussion if is not in the given repo this will fail
        content: string containing the message, can't be empty or white space
        creatorName: string name of the user creating this message
        repoAdminName: string name of the admin of the repo the message is going onto
        repoName: string name of the repo the message is going onto
        discussion_id: database id of the discussion the message is going onto

        returns a promise with no parameter
    */
	createMessageInDiscussion : function(content, creatorName, repoAdminName, repoName, discussion_id){
		//check que la discussion_id donné est bien dans ce repo
        return queryFile("CheckDiscussionHost", {
            discussionId: discussion_id,
            adminName: repoAdminName,
            repoName: repoName
        })
            .then(function (results) {
                if (!content.trim()) {
                    //checking for the content in the promise so the error will be caught in fail()
                    throw new Error("content of the message can't be empty");
                }
                if (results.length === 0) {
                    throw new Error("Error creating message in " + repoAdminName + "/" + repoName + ": discussion_id " + discussion_id + " not found");
                }

                return queryFile("CreateMessageInDiscussion", {
                    content: content,
                    creatorName: creatorName,
                    discussionId: discussion_id
                });
            });
    },

    /*
        check if the given repo is in the favorites of the connected user

        returns a promise with a bool as parameter
    */
    isRepoFav: function (connectedUserName, repoAdminName, repoName) {
        return queryFile("IsRepoFav", {
            connectedUserName: connectedUserName,
            repoAdminName: repoAdminName,
            repoName: repoName
        })
            .then(function (results) {
                return results.length != 0;
            });
    },

    /*
        returns a promise with a list of the names of the most recently favorited repos by the given user
    */
    getFavoriteRepos: function (userName, limit) {
        return queryFile("GetFavoriteRepos", { userName: userName, limit: limit })
            .then(function (results) {
                //Extract the row "name" and make sure it's a string
                return results.map(row => row.name.toString());
            });
    },

    /*
        add the given repo to a user's favorites

        returns a promise with no parameter
    */
    addToFav: function (favoriteurName, repoAdminName, repoName) {
        return queryFile("AddToFav", {
            favoriteurName: favoriteurName,
            repoAdminName: repoAdminName,
            repoName: repoName
        });
    },

    /*
        remove the given repo from the given user's favorites

        returns a promise with no parameter
    */
    removeFromFav: function (favoriteurName, repoAdminName, repoName) {
        return queryFile("RemoveFromFav", {
            favoriteurName: favoriteurName,
            repoAdminName: repoAdminName,
            repoName: repoName
        });
    },

    /*
    change the path of the profile picture of the given user to the given path

    returns a promise with no parameter
    */
    setProfilePicturePath: function (userName, path) {
        //UPDATE repos 
        //    SET current_version = current_version + 1
        //    WHERE repo_id = @repoId
        let q = "UPDATE users SET profile_pic_location = ? WHERE name = ?";
        return query(q, [path, userName]);
    },

    /*
        create a discussion in the given repo, by the given creator
        userName: string name of the repo admin
        repo: string name of the repo
        title: string title of the discussion, can't be empty of blank space
        creatorName: name of the creator of the discussion

        returns a promise with the created discussion id as parameter
    */
    createDiscussion: function (userName, repo, title, creatorName) {

        //check if repo exists first
        return doesRepoExists(userName, repo)
            .then(function (exists) {
                if (!title.trim())
                    throw new Error("can't create discussion on " + userName + "/" + repo + ": title can't be empty");
                if (!exists)
                    throw new Error("can't create discussion on " + userName + "/" + repo + ": repo doesn't exist");
                //check if creatorName exist
                return query("SELECT user_id FROM users WHERE name = ?", creatorName);
            })
            .then(function (results) {
                if (results.length === 0)
                    throw new Error("can't create discussion on " + userName + "/" + repo + ": discussion creator doesn't exist");
                return queryFile("CreateDiscussion", {
                    title: title,
                    creatorName: creatorName,
                    repoAdminName: userName,
                    repoName: repo
                });
            })
            .then(function (results) {
                return results[0].created_discussion_id;
            });
	},

    /*
        returns a promise that fails if the username/password combinaison doesn't match
        if it does match returns a promise with the user id as parameter
    */
	canAuthenticateUser : function(usernameOrEmail, password){
		let q = "SELECT user_id, password FROM users WHERE name=? OR email=?";
		var user_id;

		return query(q, [usernameOrEmail, usernameOrEmail])
		.then(function(results){
			if(results.length === 0){
				throw new SyntaxError("Username or email not found");
			}else if(results.length === 1){
				let passwordHash = results[0].password;
				user_id = results[0].user_id;
				return bcrypt.compare(password, passwordHash.toString());
			}else{
				console.log("BIG PROBLEME USERNAME/EMAIL FOUND PLUSIERUS FOIS");
				throw new SyntaxError("Something went wrong ! Contact us if it persists");
			}
		})
		.then(function(passMatch){
			if(passMatch)
				return user_id;
			else
				throw new SyntaxError("Password doesn't match !");
		});
	},

    /*
        return a promise with the user's name and email in an array as parameter
        (use spread to get them in seperated parameters)
    */
	getUserInfo : function(user_id){
		let q = "SELECT name, email FROM users WHERE user_id=?";
		return query(q, user_id)
		.then(function(results){
			if(results.length === 0){
				throw new Error("user " + user_id + " not found");
			}else{
				return [results[0].name.toString(), results[0].email.toString()];
			}
		});
    },

    /*
    return an object with all the info about the given user:
        user_id, name, email, creation_date, description, profile_pic_location
    */
    getAllUserInfo: function (name) {
        return queryFile("GetAllUserInfo", { name: name })
            .then(function (results) {
                if (results.length === 0)
                    throw new Error("can't get user info for " + name + ": name doesn't exist");
                return results[0];
            });
    },

    /*
        returns a promise with a list of the names of the recent repos as parameter
    */
	getRecentRepos : function(userName, limit){
        return queryFile("GetRecentRepos", { userName: userName, limit: limit })
            .then(function (results) {
                return results.map(row => row.name.toString())
            });
	},

    /*
        returns a list of objects representing the most recent repos
        each object has the following attributes:
            discussion_id, title, created_at, creator_id, creator_name
    */
	getRecentDiscussions : function(userName, repoName, limit){
        return queryFile("GetRecentDiscussions", { adminName: userName, repoName: repoName, limit: limit })
            .then(function (results) {
                return results;
            });
	},

    /*
        returns a promise with the most recent messages sorted with the most recent at the bottom, like a forum
        each message is object with the following properties:
            content, discussion_title, creator_id, creator_name, created_at
    */
	getRecentMessagesInDiscussion : function(userName, repoName, discussion_id, limit){
        return queryFile("GetRecentMessagesInDiscussion", {
            discussionId: discussion_id,
            adminName: userName,
            repoName: repoName,
            limit: limit
        })
		.then(function(results){
			if(results.length === 0){
				throw new Error("error getting recent messages in " + userName 
					+ "/" + repoName + ", discussion_id=" + discussion_id + ", no messages found");
            }
            //reverse the list because if we order by not desc in the query, we will get the first 
            //messages and not the last
            //but by sorting by desc we get the most recent messages but we want to display 
            //them in the inverse order 
			return results.reverse();
		});
	},

    /*
        returns a promise with a boolean determining if the given repo exists
    */
	doesRepoExists : function(adminName, repoName){
        return queryFile("CheckRepoExists", { adminName: adminName, repoName: repoName })
		.then(function(results){
			if(results.length > 1){
				console.log("MEGA PROBLEME YA DEUX REPO AVEC LE MEME NOM ET LE MEME ADMIN");
				throw new Error("MEGA PROBLEME YA DEUX REPO AVEC LE MEME NOM ET LE MEME ADMIN");
			}
			return results.length === 1;
		});
	},

    /*
        returns a promise with an array containing
            [repo_id, location, current_version]
        corresponding to the given repo
        use spread to get each parameter separated
    */
    getRepoLocation: function (adminName, repoName) {
        return queryFile("GetRepoLocation", { adminName: adminName, repoName: repoName })
		.then(function(results){
			if(results.length === 0 || results.length > 1){
				throw new Error("repo " + adminName + "/" + repoName + " not found");
			}else{
				return [results[0].repo_id, results[0].location, results[0].current_version];
			}
		});
    },

    /*
        increment the version of the given repo
    */
    incrementVersion : function(repoId) {
        return queryFile("IncrementRepoVersion", { repoId: repoId });
    },

    /*
        returns a promise witt a boolean determining if the given email is in the DB
    */
	doesEmailExists : function(email){
		let q = "SELECT user_id FROM users WHERE email=?";
		return query(q, email)
		.then(function(results){
			if(results.length > 1){
				console.log("MEGA PROBLEME DE OUF YA DEUX FOIS LE MEME EMAIL DANS LA DB MEC");
				throw new Error("MEGA PROBLEME DE OUF YA DEUX FOIS LE MEME EMAIL DANS LA DB MEC");
			}
			return results.length === 1;
		});
	},

    /*
         returns a promise witt a boolean determining if the given username is in the DB
    */
	doesUserExists : function(name){
		let sql = "SELECT user_id FROM users WHERE name=?";
		return query(sql, name)
		.then(function(results, fields){
			if(results.length > 1){
				console.log("MEGA PROBLEME DE OUF YA DEUX FOIS LE MEME USER DANS LA DB MEC");
				throw new Error("MEGA PROBLEME DE OUF YA DEUX FOIS LE MEME USER DANS LA DB MEC");
			}
			return results.length === 1;
		});
	}
}
//proxy for the overly used functions
const doesUserExists = module.exports.doesUserExists;
const doesRepoExists = module.exports.doesRepoExists;
const doesEmailExists = module.exports.doesEmailExists;