const express = require('express')
var cors = require('cors')
var Fingerprint = require('express-fingerprint')

const app = express()
const port = 3000
app.use(cors())
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


app.get('/', (req, res) => {
    console.log(req.ip)
    const headers = JSON.stringify(req.headers)
    const userAgent = req.get('user-agent')
    const agents_blocked = ['python-requests', 'go-requests', 'requests', "360Spider","404checker","404enemy","80legs","Abonti","Aboundex","Aboundexbot","Acunetix","ADmantX","AfD-Verbotsverfahren","AhrefsBot","AIBOT","AiHitBot","Aipbot","Alexibot","Alligator","AllSubmitter","AlphaBot","Anarchie","Apexoo"];
    const found = agents_blocked.find(v => userAgent.includes(v));
    if (found) {
        res.status(404).send("Bot detected")
    }
    else{
        res.status(200).send("Not a bot!")
    }
        
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})