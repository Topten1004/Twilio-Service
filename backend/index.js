require('dotenv').config()
const { v4: uuidv4 } = require("uuid");

const express = require('express')
var bodyParser = require('body-parser')
const app = express()

const AccessToken = require("twilio").jwt.AccessToken;
const VideoGrant = AccessToken.VideoGrant;
const ChatGrant = AccessToken.ChatGrant;

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

// create the twilioClient
const twilioClient = require("twilio")(
  process.env.TWILIO_API_KEY_SID,
  process.env.TWILIO_API_KEY_SECRET,
  { accountSid: process.env.TWILIO_ACCOUNT_SID }
);

app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

app.get('/', (request, response) => {
  response.send('Server is working')
})

const PORT = 3001

app.get('/token/:identity', (req, res) => {
  const identity = req.params.identity;
  const token = new AccessToken(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_API_KEY,
    process.env.TWILIO_API_SECRET,
  );

  token.identity = identity;
  token.addGrant(
    new ChatGrant({
      serviceSid: process.env.TWILIO_CHAT_SERVICE_SID,
    }),
  );

  res.send({
    identity: token.identity,
    jwt: token.toJwt(),
  });
});

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
    accountSid,
    authToken,
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

app.get("/api/video/rooms",async (req, res) => {
  try {
    // Get the last 20 rooms that are still currently in progress.
    const rooms = await twilioClient.video.rooms.list({status: 'in-progress', limit: 20});

    // If there are no in-progress rooms, return a response that no active rooms were found.
    if (!rooms.length) {
      return response.status(200).send({
        message: 'No active rooms found',
        activeRooms: [],
      });
    }

    // If there are active rooms, create a new array of `Room` objects that will hold this list.
    let activeRooms = [];

    // Then, for each room, take only the data you need and push it into the `activeRooms` array.
    rooms.forEach((room) => {
      const roomData = {
        sid: room.sid,
        name: room.uniqueName
      }

      activeRooms.push(roomData);
    });

    return response.status(200).send({activeRooms});

  } catch (error) {
    return response.status(400).send({
      message: `Unable to list active rooms`,
      error
    });
  }
});

app.post("/api/video/complete", async(req, res) => {
  const sid = req.body.sid;

  try {
    // Update the status from 'in-progress' to 'completed'.
    const room = await twilioClient.video.rooms(sid).update({status: 'completed'})

    // Create a `Room` object with the details about the closed room.
    const closedRoom = {
      sid: room.sid,
      name: room.uniqueName,
    }

    return response.status(200).send({closedRoom});

  } catch (error) {
    return response.status(400).send({
      message: `Unable to complete room with sid=${sid}`,
      error
    });
  }
});

app.post("/api/video/join-room", async (req, res) => {
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

// Start the Express server
app.listen(port, () => {
  console.log(`Express server running on port ${port}`);
});

app.post("/api/video/token", async (req, res) => {
  // return 400 if the request has an empty body or no roomName
  const roomName = req.body.roomName;
  // find or create a room with the given roomName
  findOrCreateRoom(roomName);
  // generate an Access Token for a participant in this room
  const token = getAccessToken(roomName);
  res.send({
    token: token,
  });
});
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})