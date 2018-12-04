module.exports = function(app, passport,nodemailer) {
	var mysql = require('mysql');
	var dbconfig = require('../config/database');
	var total=0;
	// using SendGrid's v3 Node.js Library
// https://github.com/sendgrid/sendgrid-nodejs


	// =====================================
	// HOME PAGE (with login links) ========
	// =====================================

	// =====================================
	// LOGIN ===============================
	// =====================================
	// show the login form
	app.get('/login',function(req, res) {
		// render the page and pass in any flash data if it exists
		try{
			req.logout();
		}
		catch(err)
		{

		}
		res.render('index.ejs', { message: req.flash('loginMessage'),successfulMessage: req.flash('successfulMessage') });
	});
	app.get('/',isLoggedIn ,function(req, res) {
		// render the page and pass in any flash data if it exists

		res.redirect("/homepage");
		console.log("\nCcc:"+req.flash('loginMessage')+"\n");
	});
	app.get('/homepage',isLoggedIn, function(req, res) {
		// render the page and pass in any flash data if it exists

		var dateObj=new Date();
		var month=dateObj.getUTCMonth()+1;
		var day=dateObj.getUTCDate();
		var year=dateObj.getUTCFullYear();
		//mylam hard code please
		var sid=req.user.sid;
		var connection = mysql.createConnection(dbconfig.connection);
				connection.query('USE ' + dbconfig.database);

		connection.query("SELECT `noadd`, `date`, `sid`, `shopname`, `category`, `productname`, `qty`, `price`, `payment_method` FROM record WHERE sid = ?",[sid], function(err, rows){


			if (err)
			{
				console.log(sid);
			}
			//block of most types
			var food = 0, drink = 0, item = 0, other = 0;
			try{
			for (var i = 0;i<rows.length; i++)
			{
				if ('food'==rows[i].category)food+=rows[i].price*rows[i].qty;
				if ('drink'==rows[i].category)drink+=rows[i].price*rows[i].qty;
				if ('item'==rows[i].category)item+=rows[i].price*rows[i].qty;
				if ('other'==rows[i].category)other+=rows[i].price*rows[i].qty;
			}
		}
			catch(err)
			{
				res.redirect('/');
				return 0;
			}
			console.log(food,drink,item,other);

			//block of most frequent shop
			var cccan = 0, uccan = 0, nacan = 0, shawcan = 0, othershop = 0;
			try{
			for (var i = 0;i<rows.length; i++)
			{
				if ('cccan'==rows[i].shopname)cccan++;
				if ('uccan'==rows[i].shopname)uccan++;
				if ('shawcan'==rows[i].shopname)shawcan++;
				if ('nacan'==rows[i].shopname)nacan++;
				if ('other'==rows[i].shopname)othershop++;
			}
		}			catch(err)
					{
						res.redirect('/');
						return 0;
					}
			console.log(cccan,uccan,shawcan,nacan,othershop);

			//block of payment method
			var cash = 0, octopus = 0, credit = 0;
			try{
			for (var i = 0;i<rows.length; i++)
			{
				if ('cash'==rows[i].payment_method)cash+=rows[i].price*rows[i].qty;
				if ('octopus'==rows[i].payment_method)octopus+=rows[i].price*rows[i].qty;
				if ('credit'==rows[i].payment_method)credit+=rows[i].price*rows[i].qty;
			}
		}
			catch(err)
			{
				res.redirect('/');
				return 0;
			}
			total = cash + octopus + credit;
			console.log(cash,octopus,credit,total);
			  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
			//block of weekly usage
			var week = [0,0,0,0,0];
			try{
			for (var i = 0;i<rows.length; i++)
			{
				var time = rows[i].date;
				var realtime=time.toString().split(" ");
				realtime[3]=parseInt(realtime[3]);
				realtime[2]=parseInt(realtime[2]);
				if(realtime[3]==year && realtime[1]==monthNames[month-1])
					if(realtime[2]>=1 && realtime[2]<=7)
					{
						week[0]+=rows[i].price*rows[i].qty;

					}
					else if(realtime[2]>7 && realtime[2]<=14)
					{
						week[1]+=rows[i].price*rows[i].qty;

					}
					else if(realtime[2]>=15 && realtime[2]<=21)
					{
						week[2]+=rows[i].price*rows[i].qty;

					}
					else if(realtime[2]>=22 && realtime[2]<=28)
					{
						week[3]+=rows[i].price*rows[i].qty;

					}
					else if(realtime[2]>=29 && realtime[2]<=31)
					{
						week[4]+=rows[i].price*rows[i].qty;

					}

			}
		}
		catch(err)
		{
			res.redirect('/');
			return 0;
		}
			res.render('homepage.ejs', {
				successfulMessage: req.flash('successfulMessage'),failMessage:req.flash('failMessage') ,user:req.user,
							//block of most types
				food:food,drink:drink,item:item,other:other,
							//block of most frequent shop
				cccan:cccan,uccan:uccan,shawcan:shawcan,nacan:nacan,othershop:othershop,
							//block of payment method
				cash:cash,octopus:octopus,credit:credit,total:total,
							//block of weekly usage
						week:week});
		});

		console.log("\nCcc:"+req.flash('loginMessage')+"\n");


	});
	app.post('/mobileauth', passport.authenticate('local-login', {
						session:true,
            successRedirect : '/successjson', // redirect to the secure profile section
            failureRedirect : '/failurejson',
						failureFlash: true// redirect back to the signup page if there is an error
        // allow flash messages

		}),
        function(req, res) {
					console.log("rem:"+req.body.remember);
            if (req.body.remember) {
              req.session.cookie.maxAge = 1000 * 60 * 3;
            } else {
              req.session.cookie.expires = false;
            }


    });
app.get('/successjson', function(req, res) {
      res.json(req.user);
});

app.get('/failurejson', function(req, res) {
    res.json({ message: 404 });
});
	// process the login form
	app.post('/', passport.authenticate('local-login', {
						session:true,
            successRedirect : '/homepage', // redirect to the secure profile section
            failureRedirect : '/',
						failureFlash: true// redirect back to the signup page if there is an error
        // allow flash messages

		}),
        function(req, res) {

            if (req.body.remember) {
              req.session.cookie.maxAge = 1000 * 60 * 3;
            } else {
              req.session.cookie.expires = false;
            }

        res.redirect('/homepage');
    });
    app.get('/record',isLoggedIn, function(req, res) {
    			var sid=req.user.sid;
		var connection = mysql.createConnection(dbconfig.connection);
				connection.query('USE ' + dbconfig.database);
				    	console.log("mylamb"+sid);
	    var temprowlen=0;
		connection.query("SELECT * FROM record WHERE sid = ?",[sid], function(err, rows){
			try{
			temprowlen=rows.length;
			}
			catch(err)
			{
				res.redirect('/');
				return 0;
			}
			if (err)
			{
				console.log(sid);
			}
			var cash = 0, octopus = 0, credit = 0;
			try{
			for (var i = 0;i<rows.length; i++)
			{
				if ('cash'==rows[i].payment_method)cash+=rows[i].price*rows[i].qty;
				if ('octopus'==rows[i].payment_method)octopus+=rows[i].price*rows[i].qty;
				if ('credit'==rows[i].payment_method)credit+=rows[i].price*rows[i].qty;
			}
		}
		catch(err)
		{
			res.redirect('/');
			return 0;
		}
			total = cash + octopus + credit;

			var date=[], transaction=[] , price=[] , category=[] , method=[] , shop=[] ,qty=[],totalR=[],noadd=[];
			for (var i = 0;i<temprowlen; i++){
				console.log("datex:"+rows[i].date);
				date.push(rows[i].date);
				transaction.push(rows[i].productname);
				qty.push(rows[i].qty);
				price.push(rows[i].price);
				category.push(rows[i].category);
				method.push(rows[i].payment_method);
				shop.push(rows[i].shopname);
				totalR.push(rows[i].price*rows[i].qty);
				noadd.push(rows[i].noadd);
			}
			res.render('record.ejs',{noadd:noadd,user:req.user,total:total,sid:sid,totalrows:temprowlen,
				date:date,transaction:transaction,price:price,category:category,method:method,shop:shop,qty:qty,totalR:totalR});
		}

);
		if(temprowlen!=0)
		res.render('record.ejs',{user:req.user,sid:sid,totalrows:temprowlen});
		console.log("mylamp");

    });
		app.post('/delete', function(req, res, next) {
				var record_id=req.body.id;

			 var connection = mysql.createConnection(dbconfig.connection);
	 				connection.query('USE ' + dbconfig.database);

	 		connection.query("DELETE FROM record WHERE noadd = ?",[record_id], function(err, rows){
						 console.log("JX:"+JSON.stringify(rows));
						 res.send({rows:rows});
			});


		});
		app.get('/map',isLoggedIn, function(req, res) {
			var sid=req.user.sid;
		var connection = mysql.createConnection(dbconfig.connection);
		connection.query('USE ' + dbconfig.database);

		connection.query("SELECT * FROM record WHERE sid = ?",[sid], function(err, rows){
			if (err)
			{
				console.log(sid);
			}
					var cash = 0, octopus = 0, credit = 0;
		try{
			for (var i = 0;i<rows.length; i++)
			{
				if ('cash'==rows[i].payment_method)cash+=rows[i].price*rows[i].qty;
				if ('octopus'==rows[i].payment_method)octopus+=rows[i].price*rows[i].qty;
				if ('credit'==rows[i].payment_method)credit+=rows[i].price*rows[i].qty;
			}
		}
			catch(err)
			{
				res.redirect('/');
				return 0;
			}
			total = cash + octopus + credit;
			var sid;
			console.log("sid");
			res.render('map.ejs',{user:req.user,total:total});
		}

	); });

	// =====================================
	// SIGNUP ==============================
	// =====================================
	// show the signup form
	app.post('/forgotpw', function(req, res, next) {
		var email=req.body.pwf;

		var connection = mysql.createConnection(dbconfig.connection);
		connection.query('USE ' + dbconfig.database);
		connection.query("SELECT * FROM student WHERE email = ?",[email], function(err, rows){
					console.log("emaiilll:"+email);
							console.log("georg:"+rows.length);
				if (err)
				{
							console.log("yey");
							return 0;
			  }
				if(rows.length==0)
				{
					console.log("yey");
					req.flash('loginMessage', 'Oops! No user found.');
					res.redirect('/login');
					return 0;
				}
				var smtpTransport = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'koekax@gmail.com',
          pass: 'a25480097'
        }
      });
      var mailOptions = {
        to: rows[0].email,
        from: 'koekax@gmail.com',
        subject: 'MoneyPig Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          rows[0].password+
          ' If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err,info) {
				if(err)
		console.log(err)
			else{
			req.flash('successfulMessage', 'Please get back your password in email!');
			res.redirect('/');
		}
      });
				// all is well, return successful user
		});
			});

	app.get('/registration', function(req, res) {
		// render the page and pass in any flash data if it exists
		res.render('registration.ejs', { message: req.flash('signupMessage') });
	});

	// process the signup form
	app.post('/registration', passport.authenticate('local-signup', {
		successRedirect : '/login', // redirect to the secure profile section
		failureRedirect : '/registration', // redirect back to the signup page if there is an error
		failureFlash : true // allow flash messages
	}));
	app.post('/profile', function(req, res) {
		// render the page and pass in any flash data if it exists
		var firstname0=req.body.firstname0;
		var lastname0=req.body.lastname0;
		var gender0=req.body.gender0;
		var college0=req.body.college0;
		var budget0=req.body.budget0;

		var password0=req.body.password0;
		var password1=req.body.password1;
		var password2=req.body.password2;
		var email1=req.body.email1;
		var email2=req.body.email2;

		var sid=req.user.sid;
		var connection = mysql.createConnection(dbconfig.connection);
		connection.query('USE ' + dbconfig.database);
	/*	console.log("lastname "+lastname0+" "+"firstname "+firstname0+"gender "+gender0+
  			"college "+college0+"budget "+budget0+
  			"password "+password1+"password "+password2+" "+"email1 "+email1+" "+"email2 "+email2);*/

		 //mylam for checking and insert profile data
		if(0!=budget0.length)
  			connection.query("UPDATE student SET budget=? WHERE sid = ?",[budget0,sid]);
  		if(0!=firstname0.length)
  			connection.query("UPDATE student SET firstname=? WHERE sid = ?",[firstname0,sid]);
  		if(0!=lastname0.length)
  			connection.query("UPDATE student SET lastname=? WHERE sid = ?",[lastname0,sid]);
  		if(0!=gender0.length)
  			connection.query("UPDATE student SET gender=? WHERE sid = ?",[gender0,sid]);
  		if(0!=college0.length)
  			connection.query("UPDATE student SET college=? WHERE sid = ?",[college0,sid]);
  		console.log("I am HEEH"+password0);
  		if(password0==req.user.password){
  			console.log("i am diu"+password1.length+" "+password1+" "+password2);
			if(password1.length !=0 && password1==password2){
				console.log("I am HEEH");
  				connection.query("UPDATE student SET password=? WHERE sid = ?",[password1,sid]);
			}}
			else if(password1.length !=0){
				req.flash('failMessage', 'Invalid old password	!');
				res.redirect('/homepage');
				return 0;
			}
  		if(email1.length!=0 && email1==email2){
  			connection.query("UPDATE student SET email=? WHERE sid = ?",[email1,sid]);
			}
			else if (email1.length!=0 && email1!=email2)
			{
				req.flash('failMessage', 'Email confirmation are not the same	!');
				res.redirect('/homepage');
				return 0;
			}
  		connection.query("SELECT * FROM student WHERE sid = ?",[sid], function(err, rows){
			if (err)
			{
				console.log(sid);
			}
  			console.log("after "+college0);
			var gender,lastname,firstname,college,budget;
			var email;

					email = rows[0].email;
					gender = rows[0].gender;
					lastname = rows[0].lastname;

					firstname = rows[0].firstname;
					college = rows[0].college;
					budget = rows[0].budget;
					sid = rows[0].sid;
			req.flash('successfulMessage', 'Update successfully!');
			res.redirect('/homepage');
		});

	});
	app.post('/record', function(req, res) {
		var user=req.user;
		console.log("user"+JSON.stringify(user));
		var sid=req.user.sid;

		var connection = mysql.createConnection(dbconfig.connection);
		connection.query('USE ' + dbconfig.database);
		var request=req.query;

		var querystring="SELECT * FROM record WHERE sid = ?";

		if(request.category!="category")
		{
			console.log("category"+request.category);
			querystring+=" AND category='"+request.category+"'";

		}
		if(request.payment_method!="method")
		{
			querystring+=" AND payment_method='"+request.payment_method+"'";
		}
		if(request.shopname!="shop")
		{
			querystring+=" AND shopname='"+request.shopname+"'";
		}
		querystring+=" AND price*qty between "+request.price_min+" and "+request.price_max;

		console.log("categorybx"+querystring);
	connection.query(querystring,[sid], function(err, rows){
	res.send({rows:rows});
	});



	}
);
		app.post('/add', function(req, res) {
		// render the page and pass in any flash data if it exists
		var sid=req.user.sid;

		var datea0=req.body.datea0;
		var categorya0=req.body.categorya0;
		var payment_methoda0=req.body.payment_methoda0;
		var pricea0=req.body.pricea0;
		var productnamea0=req.body.productnamea0;
		var qtya0=req.body.qtya0;
		var shopnamea0=req.body.shopnamea0;

		var connection = mysql.createConnection(dbconfig.connection);
		connection.query('USE ' + dbconfig.database);
		console.log("ADDdate "+datea0+"category "+categorya0+"payment_method "+payment_methoda0+"price "+pricea0+"productname "+productnamea0+"qty "+qtya0+"shopname "+shopnamea0);
		// mylam for checking and insert add data

		if(datea0.length!=0 && categorya0.length!=0 && payment_methoda0.length!=0 && productnamea0.length!=0 && qtya0.length!=0 && pricea0.length!=0 && shopnamea0!=0)
			connection.query("INSERT INTO record (date, sid, shopname, category, productname,qty,price,payment_method) VALUES (?,?,?,?,?,?,?,?)",[datea0,sid,shopnamea0,categorya0,productnamea0,pricea0,qtya0,payment_methoda0], function(err, rows){
		console.log("AfterADDdate "+datea0+"category "+categorya0+"payment_method "+payment_methoda0+"price "+pricea0+"productname "+productnamea0+"qty "+qtya0+"shopname "+shopnamea0);
		if (err)
			console.log(sid);
		console.log(rows);

		req.flash('successfulMessage', 'Insert successfully!');
		res.redirect('/homepage');
		}

	);
	});
	// =====================================
	// PROFILE SECTION =========================adfrettr
	// =====================================
	// we will want this protected so you have to be logged in to visit
	// we will use route middleware to verify this (the isLoggedIn function)
	app.get('/profile',isLoggedIn, function(req, res) {
    	var sid=req.user.sid;
		var connection = mysql.createConnection(dbconfig.connection);
		connection.query('USE ' + dbconfig.database);
			var cash = 0, octopus = 0, credit = 0;
		connection.query("SELECT * FROM record WHERE sid = ?",[sid], function(err, rows){
			if (err)
			{
				console.log(sid);
			}

					try{
			for (var i = 0;i<rows.length; i++)
			{
				if ('cash'==rows[i].payment_method)cash+=rows[i].price*rows[i].qty;
				if ('octopus'==rows[i].payment_method)octopus+=rows[i].price*rows[i].qty;
				if ('credit'==rows[i].payment_method)credit+=rows[i].price*rows[i].qty;
			}
		}
		catch(err)
		{
			res.redirect('/');
			return 0;
		}
			total = cash + octopus + credit;
		});
		connection.query("SELECT * FROM student WHERE sid = ?",[sid], function(err, rows){
			if (err)
			{
				console.log(sid);
			}
			var gender,lastname,firstname,college,budget,email;

					gender = rows[0].gender;
					budget = rows[0].budget;
					lastname = rows[0].lastname;
					firstname = rows[0].firstname;
					college = rows[0].college;
					email = rows[0].email;
					sid = rows[0].sid;
			console.log("coooollleegee "+rows[0].college);
			res.render('profile.ejs',{total:total,user:req.user,password:rows[0].password,gender:gender,lastname:lastname,
				sid:sid,firstname:firstname,
				college:college,budget:budget,email:email,name:req.user.name});
		}


); });
		app.get('/promotionandoffer',isLoggedIn, function(req, res) {
    	var sid=req.user.sid;
		var connection = mysql.createConnection(dbconfig.connection);
		connection.query('USE ' + dbconfig.database);

		connection.query("SELECT * FROM record WHERE sid = ?",[sid], function(err, rows){
			if (err)
			{
				console.log(sid);
			}
					var cash = 0, octopus = 0, credit = 0;
		try{
			for (var i = 0;i<rows.length; i++)
			{
				if ('cash'==rows[i].payment_method)cash+=rows[i].price*rows[i].qty;
				if ('octopus'==rows[i].payment_method)octopus+=rows[i].price*rows[i].qty;
				if ('credit'==rows[i].payment_method)credit+=rows[i].price*rows[i].qty;
			}
		}
			catch(err)
			{
				res.redirect('/');
				return 0;
			}
			total = cash + octopus + credit;
			var sid;
			console.log("sid");
			res.render('promotionandoffer.ejs',{user:req.user,total:total});
		}

); });
app.get('/coupon',isLoggedIn, function(req, res) {
	var sid=req.user.sid;
var connection = mysql.createConnection(dbconfig.connection);
connection.query('USE ' + dbconfig.database);

connection.query("SELECT * FROM record WHERE sid = ?",[sid], function(err, rows){
	if (err)
	{
		console.log(sid);
	}
			var cash = 0, octopus = 0, credit = 0;
			try{
	for (var i = 0;i<rows.length; i++)
	{
		if ('cash'==rows[i].payment_method)cash+=rows[i].price*rows[i].qty;
		if ('octopus'==rows[i].payment_method)octopus+=rows[i].price*rows[i].qty;
		if ('credit'==rows[i].payment_method)credit+=rows[i].price*rows[i].qty;
	}
}
catch(err)
{
	res.redirect('/');
	return 0;
}
	total = cash + octopus + credit;
	var sid;
	console.log("sid");
	res.render('coupon.ejs',{user:req.user,total:total});
}

); });
		app.get('/add',isLoggedIn, function(req, res) {
    	var sid=req.user.sid;
		var connection = mysql.createConnection(dbconfig.connection);
		connection.query('USE ' + dbconfig.database);

		connection.query("SELECT * FROM student WHERE sid = ?",[sid], function(err, rows){
			if (err)
			{
				console.log(sid);
			}
			var sid;
			console.log("sid");
			res.render('add.ejs',{sid:sid});
		}

); });
app.post('/mobileadd', function(req, res) {
	var sid=req.user.sid;
	var receipt=req.body;
	var connection = mysql.createConnection(dbconfig.connection);
	connection.query('USE ' + dbconfig.database);
	connection.query("INSERT INTO record (date, sid, shopname, category, productname,qty,price,payment_method) VALUES (?,?,?,?,?,?,?,?)",[receipt.date,parseInt(sid),receipt.shopname,receipt.category,receipt.productname,parseInt(receipt.qty),parseInt(receipt.price),receipt.payment_method], function(err, rows){
		if (err)
		{
			console.log(sid);
		}
console.log(rows);
		res.send('success');
	}

);
});
	// =====================================
	// LOGOUT ==============================
	// =====================================
	app.get('/logout', function(req, res) {
		req.logout();
		res.redirect('/');
	});
};

// route middleware to make sure
function isLoggedIn(req, res, next) {
	// if user is authenticated in the session, carry on
	if (req.isAuthenticated())
		return next();

	// if they aren't redirect them to the home page
	res.redirect('/login');
}
