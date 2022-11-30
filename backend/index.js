require('dotenv').config()
const express = require('express')
var bodyParser = require('body-parser')
const app = express()

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);

app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

  app.get('/', (request, response) => {
      response.send('Server is working')
  })

  app.post('/api/sendSMS', (request, response) => {

    const { body, from, to} = request.body;

    console.log(body, from, to);
    try{
        client.messages
        .create({body: body, from: from, to: to})
        .then(message => console.log(message.sid));
        
    } catch(err){
        return response.status(500).json({msg: err.message})
    }
  })

  const PORT = 3001
  app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
  })