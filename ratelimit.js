import rateLimit from 'express-rate-limit';
export const rateLimiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000, // 24 hrs in milliseconds
    max: 3,
    message: 'You have exceeded the 100 requests in 24 hrs limit!', 
    standardHeaders: true,
    legacyHeaders: false,
  });


const headers = JSON.stringify(req.headers);
const userAgent = req.get('user-agent')
const agents_blocked = ['python-requests', 'go-requests', 'requests', "360Spider","404checker","404enemy","80legs","Abonti","Aboundex","Aboundexbot","Acunetix","ADmantX","AfD-Verbotsverfahren","AhrefsBot","AIBOT","AiHitBot","Aipbot","Alexibot","Alligator","AllSubmitter","AlphaBot","Anarchie","Apexoo"];
const found = agents_blocked.find(v => userAgent.includes(v));
if (found) {
    return res.status(404).json({
        error: 'You are a bot!'
        })
}
else{
    return res.status(200).json({
        success: 'You are not a bot!'
        })
}   