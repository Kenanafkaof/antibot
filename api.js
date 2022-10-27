const express = require('express')
var cors = require('cors')
const mysql = require('mysql')
var Fingerprint = require('express-fingerprint')
var rateLimit = require('express-rate-limit')

for (let i = 0; i < 100; i++) {
    pool = mysql.createPool({
        host: 'us-cdbr-east-06.cleardb.net',
        user: 'bbbac5cf56f00d',
        password: 'dcbcef64',
        database: 'heroku_0ba58b402643631',
        connectionLimit : 10
    });
}


const limiter = rateLimit({
	windowMs: 1 * 60 * 1000, // 1 minutes
	max: 10, // Limit each IP to 100 requests per `window` (here, per 1 minutes)
	standardHeaders: true, 
	legacyHeaders: false,
    handler: function (req, res, /*next*/) {
        return res.status(403).json({
          error: 'You sent too many requests. Please wait a while then try again'
        })
    }
})

const initialCheck = function (req, res, next) {
    const userAgent = req.get('user-agent')
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


app.get('/token', (req, res) => {
    const user = req.get('user-agent')
    console.log(req.headers)
    console.log(req.fingerprint)
    const authorization_session = req.headers.sessionid
    function configureToken() {
        var rand = function() {
            return Math.random().toString(36).substr(2); // remove `0.`
        };
        
        var token = function() {
            return rand() + rand() + rand() + rand(); // to make it longer
        };
        
        return token();
      }

    if (authorization_session === undefined) {
        return res.status(403).json({
            error: 'You are a bot!'
        })
    }
    else {
        const token = configureToken()
        var add_data = "INSERT INTO tokens (token, user) VALUES ('"+token+"', '"+user+"')";
        pool.query(add_data, function (err, result, fields) {
            if (err) throw err;
        });
        return res.status(200).json({
            token: token
        }) 
    
    }


});

app.get('/', (req, res) => {
    const userAgent = req.get('user-agent')
    const authentication = req.headers.authorization;
    const cookie = req.headers.validation;
    function validateToken(token) {
        pool.getConnection(function(err, connection) {
            pool.query('SELECT * FROM tokens WHERE token = ? AND user = ?', [token, userAgent], function(error, results, fields) {
                if (error) throw error;
                if(results.length >= 1){
                    return res.status(200).json({
                        success: 'You are not a bot!'
                    })
                }else{  
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
            return res.status(200).json({
                success: 'You are not a bot!'
            })
        }else {
            validateToken(authentication)
        }
    }else {
        return res.status(403).json({
            error: 'You are a bot!'
        })
    }
    
});
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
});