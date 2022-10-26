const express = require('express')
var cors = require('cors')
const mysql = require('mysql')
var Fingerprint = require('express-fingerprint')
var rateLimit = require('express-rate-limit')
const e = require('express')

for (let i = 0; i < 100; i++) {
    pool = mysql.createPool({
        host: 'us-cdbr-east-06.cleardb.net',
        user: 'bbbac5cf56f00d',
        password: 'dcbcef64',
        database: 'heroku_0ba58b402643631',
        connectionLimit : 10
    });
}

function createDatabase() {
    var sql = "CREATE TABLE bots (useragent VARCHAR(255), hash VARCHAR(255), platform VARCHAR(255), reason VARCHAR(255))";
    pool.query(sql, function (err, result) {
        if (err) throw err;
        console.log("Table created");
    });
}

const limiter = rateLimit({
	windowMs: 1 * 60 * 1000, // 1 minutes
	max: 50, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: function (req, res, /*next*/) {
        return res.status(403).json({
          error: 'You sent too many requests. Please wait a while then try again'
        })
    }
})

const initialCheck = function (req, res, next) {
    const userAgent = req.get('user-agent')
    const hash_check = req.fingerprint.hash
    if (hash_check == undefined || hash_check == "undefined" || hash_check == "" || hash_check == null) {
        return res.status(403).json({
            error: 'You are a bot!'
        })
    }
    const agents_blocked = ['python-requests', 'go-requests', 'requests', "360Spider","403checker","403enemy","80legs","Abonti","Aboundex","Aboundexbot","Acunetix","ADmantX","AfD-Verbotsverfahren","AhrefsBot","AIBOT","AiHitBot","Aipbot","Alexibot","Alligator","AllSubmitter","AlphaBot","Anarchie","Apexoo"];
    const found = agents_blocked.find(v => userAgent.includes(v));
    if (found) {
        return res.status(403).json({
            error: 'You are a bot!'
        })
    }
    else{
        next();
        return userAgent
    } 
}



const app = express()
const port = 3000
app.use(cors())
app.use(limiter)
app.use(initialCheck)
app.set('trust proxy', true)

app.use(Fingerprint({
    parameters:[
		// Defaults
		Fingerprint.useragent,
		Fingerprint.acceptHeaders,
		Fingerprint.geoip,

		// Additional parameters
		function(next) {
			// ...do something...
			next(null,{
			'param1':'value1'
			})
		},
		function(next) {
			// ...do something...
			next(null,{
			'param2':'value2'
			})
		},
	]
}))


const failedValidation = function (headers, fingerprint, platform, reason, req, res, next) {
    const data = JSON.stringify(headers)
    const agent = data.replace(/\'/gi,'')
    var add_data = "INSERT INTO bots (useragent, hash, platform, reason) VALUES ('"+agent+"', '"+fingerprint+"', '"+platform+"', '"+reason+"')";
    pool.query(add_data, function (err, result, fields) {
        if (err) throw err;
    });
    return
}

app.get('/token', (req, res) => {
    const headers = req.headers
    const user = req.get('user-agent')
    const fingerprint = req.fingerprint.hash
    var platform = ""
    try {
        platform = req.headers['sec-ch-ua-platform'].replace(/["']+/g, '')
    }catch(err){
        platform = req.headers['sec-ch-ua-platform']
    }
    const authorization_session = req.headers.sessionid
    function validateSession(authorization_session) {
        pool.getConnection(function(err, connection, next) {
            pool.query('SELECT * FROM sessions WHERE sessionid = ? AND user = ?', [authorization_session, user], function(error, results, fields) {
                if (error) throw error;
                if (results.length == 0){
                    var add_data = "INSERT INTO sessions (sessionid, user) VALUES ('"+authorization_session+"', '"+user+"')";
                    pool.query(add_data, function (err, result, fields) {
                        if (err) throw err;
                    });
                    const token = configureToken()
                    var add_data = "INSERT INTO tokens (token, user) VALUES ('"+token+"', '"+user+"')";
                    pool.query(add_data, function (err, result, fields) {
                        if (err) throw err;
                        return res.status(200).json({
                            token: token
                        }) 
                    });
                }else {
                    const reason = "session id already exists"
                    failedValidation(headers, fingerprint, platform, reason)
                    return res.status(403).json({
                        error: 'You are a bot!'
                    })
                }
            });
        });
    }
    function deleteTableRow(authorization_session) {
        pool.query("DELETE FROM sessions WHERE sessionid = ? AND user = ?", [authorization_session, user], function (err, result) {
            if (err) throw err;
            console.log("deleted row!")
        }); 
    }
    //setTimeout(deleteTableRow, 15000, authorization_session);
    function configureToken() {
        var rand = function() {
            return Math.random().toString(36).substr(2); // remove `0.`
        };
        
        var token = function() {
            return rand() + rand() + rand() + rand(); // to make it longer
        };
        
        return token();
      }
    if (authorization_session === undefined || authorization_session === null || authorization_session === "") {
        const reason = "authorization is missing"
        failedValidation(headers, fingerprint, platform, reason)
        return res.status(403).json({
            error: 'You are a bot!'
        })
    }else {
        validateSession(authorization_session)
    }
});

app.get('/', (req, res) => {
    const headers = req.headers
    const userAgent = req.get('user-agent')
    const fingerprint = req.fingerprint.hashtry
    var platform = ""
    try {
        platform = req.headers['sec-ch-ua-platform'].replace(/["']+/g, '')
    }catch(err){
        platform = req.headers['sec-ch-ua-platform']
    }
    const authentication = req.headers.authorization;
    const cookie = req.headers.validation;
    function validateToken(token) {
        pool.getConnection(function(err, connection) {
            pool.query('SELECT * FROM tokens WHERE token = ? AND user = ?', [token, userAgent], function(error, results, fields) {
                if (error) throw error;
                if(results.length >= 1){
                    var add_data = "INSERT INTO successful (useragent, hash, platform) VALUES ('"+userAgent+"', '"+fingerprint+"', '"+platform+"')";
                    pool.query(add_data, function (err, result, fields) {
                        if (err) throw err;
                    });
                    return res.status(200).json({
                        success: 'You are not a bot!'
                    })
                }else{  
                    const reason = "invalid token"
                    failedValidation(headers, fingerprint, platform, reason)
                    return res.status(403).json({
                        error: 'Invalid token. You are a bot!'
                    })
                }
            });
            pool.query("DELETE FROM tokens WHERE token = ? AND user = ?", [token, userAgent], function (err, result) {
                if (err) throw err;
            });
        });
    }
    if (cookie != undefined || "" || null){
        if (authentication === undefined) {
            const reason = "authentication is emtpy"
            failedValidation(headers, fingerprint, platform, reason)
            return res.status(403).json({
                error: 'You are a bot!'
            })
        }else {
            validateToken(authentication)
        }
    }else {
        const reason = "empty exception"
        failedValidation(headers, fingerprint, platform, reason)
        return res.status(403).json({
            error: 'You are a bot!'
        })
    }
    
});


app.get('/success', (req, res) => {
    pool.query("SELECT * FROM successful", function (err, result, fields) {
        if (err) throw err;
        let returned_data = result
        res.status(200).send(returned_data)
    });
});
app.get('/failed', (req, res) => {
    pool.query("SELECT * FROM bots", function (err, result, fields) {
        if (err) throw err;
        let returned_data = result
        res.status(200).send(returned_data)
    });
});
app.get('/delete', (req, res) => {
    var sql = "DELETE FROM successful;";
    pool.query(sql, function (err, result) {
        if (err) throw err;
        console.log("Number of records deleted: " + result.affectedRows);
    });
});
app.get('/deletefailed', (req, res) => {
    var sql = "DELETE FROM bots;";
    pool.query(sql, function (err, result) {
        if (err) throw err;
        console.log("Number of records deleted: " + result.affectedRows);
    });
});
app.get('/deletesessions', (req, res) => {
    var sql = "DELETE FROM sessions;";
    pool.query(sql, function (err, result) {
        if (err) throw err;
        console.log("Number of records deleted: " + result.affectedRows);
    });
});


//app.listen(port, () => {
  //console.log(`Example app listening on port ${port}`)
//});

app.listen(process.env.PORT, '0.0.0.0');
