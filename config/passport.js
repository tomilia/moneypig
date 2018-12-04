var LocalStrategy   = require('passport-local').Strategy;

// load up the user model
var mysql = require('mysql');
var bcrypt = require('bcrypt-nodejs');
var dbconfig = require('./database');
console.log(dbconfig.database);
var connection = mysql.createConnection(dbconfig.connection);

connection.query('USE ' + dbconfig.database);
// expose this function to our app using module.exports
module.exports = function(passport) {
    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
      console.log("serial:"+JSON.stringify(user));
    done(null, user.sid);
});

    // used to deserialize the user
    passport.deserializeUser(function(sid, done) {
    console.log("deserial:"+sid);
        connection.query("SELECT * FROM student WHERE sid = ? ",[sid], function(err, rows){
            done(err, rows[0]);
        });
    });

    // =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use(
        'local-signup',
        new LocalStrategy({
            // by default, local strategy uses username and password, we will override with email
            usernameField : 'name',
            passwordField : 'password',
            passReqToCallback : true // allows us to pass back the entire request to the callback
        },
        function(req, username, password, done) {
            // find a user whose email is the same as the forms email
            // we are checking to see if the user trying to login already exists
            connection.query("SELECT * FROM student WHERE name = ? OR sid= ? OR email=?",[username,req.body.sid,req.body.email], function(err, rows) {
                if (err)
                {
                    return done(err);
                }
                if (rows.length) {
                    return done(null, false, req.flash('signupMessage', 'That username/email/sid is already taken.'));
                } else {
                    // if there is no user with that username
                    // create the user
                    var newUserMysql = {
                        username: username,
                        password: password  // use the generateHash function in our user model
                    };


                    var insertQuery = "INSERT INTO student ( name,password,sid,firstname,lastname,email,gender,college,budget) values (?,?,?,?,?,?,?,?,?)";

                    connection.query(insertQuery,[newUserMysql.username, newUserMysql.password,req.body.sid,req.body.firstname,req.body.lastname,req.body.email,req.body.gender,req.body.college,req.body.budget],function(err, rows) {
                          console.log("namexx:"+JSON.stringify(rows)+" "+rows.insertId+ " "+"\n");
                        newUserMysql.sid = req.body.sid;

                        return done(null, newUserMysql, req.flash('loginMessage', 'User Created successfully!.'));
                    });
                }
            });
        })
    );

    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use(
        'local-login',
        new LocalStrategy({
            // by default, local strategy uses username and password, we will override with email
            usernameField : 'name',
            passwordField : 'password',
            passReqToCallback : true // allows us to pass back the entire request to the callback
        },
        function(req, username, password, done) { // callback with email and password from our form
            connection.query("SELECT * FROM student WHERE name = ?",[username], function(err, rows){
                if (err)
                {
                    return done(err);
                  }
                if (!rows.length) {
                    return done(null, false, req.flash('loginMessage', 'No user found.')); // req.flash is the way to set flashdata using connect-flash
                }

                // if the user is found but the password is wrong
                if (password!=rows[0].password)
                {
                    return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.')); // create the loginMessage and save it to session as flashdata
                  }
                  		console.log(req.body);
                      console.log(rows[0]);
                // all is well, return successful user
                return done(null, rows[0]);
            });
        })
    );
};
