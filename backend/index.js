require('dotenv').config()
const {v4: uuidv4} = require("uuid");

const express = require('express')
var bodyParser = require('body-parser')
const app = express()

const AccessToken = require("twilio").jwt.AccessToken;
const VideoGrant = AccessToken.VideoGrant;

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioClient = require('twilio')(accountSid, authToken);

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
        twilioClient.messages
        .create({body: body, from: from, to: to})
        .then(message => console.log(message.sid));
        
    } catch(err){
        return response.status(500).json({msg: err.message})
    }
  })

  app.post("/api/joinRoom", async (req, res) => {
    // return 400 if the request has an empty body or no roomName
    if (!req.body || !req.body.roomName) {
      return res.status(400).send("Must include roomName argument.");
    }
    const roomName = req.body.roomName;
    // find or create a room with the given roomName
    findOrCreateRoom(roomName);
    // generate an Access Token for a participant in this room
    const token = getAccessToken(roomName);
    res.send({
      token: token,
    });
  });
  
  const PORT = 3001

  const findOrCreateRoom = async (roomName) => {
    try {
      // see if the room exists already. If it doesn't, this will throw
      // error 20404.
      await twilioClient.video.rooms(roomName).fetch();
    } catch (error) {
      // the room was not found, so create it
      if (error.code == 20404) {
        await twilioClient.video.rooms.create({
          uniqueName: roomName,
          type: "go",
        });
      } else {
        // let other errors bubble up
        throw error;
      }
    }
  };

  const getAccessToken = (roomName) => {
    // create an access token
    const token = new AccessToken(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_API_KEY_SID,
      process.env.TWILIO_API_KEY_SECRET,
      // generate a random unique identity for this participant
      { identity: uuidv4() }
    );
    // create a video grant for this specific room
    const videoGrant = new VideoGrant({
      room: roomName,
    });
  
    // add the video grant
    token.addGrant(videoGrant);
    // serialize the token and return it
    return token.toJwt();
  };
  app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
  })