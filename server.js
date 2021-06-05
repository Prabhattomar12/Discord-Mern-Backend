import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import db from './dbModel.js';
import Pusher from 'pusher';
import dotEnv from 'dotenv';
                         
// app configs
dotEnv.config();
const app = express();
const PORT = process.env.PORT || 9000;

const pusher = new Pusher({
  appId: '1215006',
  key: 'c6bd25b9fc11f53f03d5',
  secret: 'a28eb4300a0b0b8c39d6',
  cluster: 'ap2',
  useTLS: true,
});

// middlewares
app.use(express.json());
app.use(cors());

// db configs
const MONGODB_URI = process.env.MONGODB_URI;
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true,
});

mongoose.connection.once('open', () => {
  console.log('DB Connected');

  const changeStream = mongoose.connection.collection('conversations').watch();

  changeStream.on('change', (change) => {
    if (change.operationType === 'insert') {
      pusher.trigger('channels', 'newChannel', {
        change: change,
      });
    } else if (change.operationType === 'update') {
      pusher.trigger('conversation', 'newMessage', {
        change: change,
      });
    } else {
      console.log('Error in triggering pusher');
    }
  });
});

// routes
app.get('/', (req, res) => res.status(200).send('Hello World'));

app.post('/new/channel', (req, res) => {
  const data = req.body;
  db.create(data, (err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(201).send(data);
    }
  });
});

app.get('/get/channelsList', (req, res) => {
  db.find((err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      let channelList = [];
      data.map((channel) => {
        let currChannel = {
          channelName: channel.channelName,
          id: channel._id,
        };
        channelList.push(currChannel);
      });
      res.status(200).send(channelList);
    }
  });
});

app.post('/new/message', (req, res) => {
  db.updateOne(
    { _id: req.query.id },
    { $push: { conversation: req.body } },
    (err, data) => {
      if (err) {
        res.status(500).send(err);
      } else {
        res.status(201).send(data);
      }
    }
  );
});

app.get('/get/conversation', (req, res) => {
  db.find({ _id: req.query.id }, (err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(200).send(data);
    }
  });
});

// listen

app.listen(PORT, () => console.log(`server is running at Port no. :  ${PORT}`));

