require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const weather = require('weather-js'); 

const Reading = require('./models/Reading');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

// DB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => { console.error('Mongo error:', err); process.exit(1); });

// helpers
const weatherLookup = (location) =>
  new Promise((resolve, reject) => {
    weather.find({ search: location, degreeType: 'C' }, (err, result) => {
      if (err) return reject(err);
      if (!result || !result[0]) return reject(new Error('No weather result'));
      const { current } = result[0];
      resolve({
        location: result[0].location?.name,
        observationTime: current?.observationtime,
        skytext: current?.skytext,
        temperatureC: Number(current?.temperature),
        feelslikeC: Number(current?.feelslike),
        humidity: Number(current?.humidity)
      });
    });
  });

// CRUD: /readings
app.get('/readings', async (req, res) => {
  const list = await Reading.find({}).sort({ createdAt: -1 });
  res.json(list);
});

app.get('/readings/:id', async (req, res) => {
  const doc = await Reading.findById(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json(doc);
});

app.post('/readings', async (req, res) => {
  if (typeof req.body.temperature !== 'number')
    return res.status(400).json({ error: 'temperature (Number) required' });

  const doc = await Reading.create({
    temperature: req.body.temperature,
    sensorName: req.body.sensorName,
    address: req.body.address,
    location: req.body.location
  });
  res.status(201).json(doc);
});

app.put('/readings/:id', async (req, res) => {
  const doc = await Reading.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json(doc);
});

app.delete('/readings/:id', async (req, res) => {
  const doc = await Reading.findByIdAndDelete(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json({ deleted: true, id: doc._id.toString() });
});

// Latest temperature: /readings/latest
app.get('/readings-latest', async (_req, res) => {
  const latest = await Reading.findOne({}).sort({ createdAt: -1 });
  if (!latest) return res.status(404).json({ error: 'No readings yet' });
  res.json(latest);
});

// Map/location weather lookup via weather-js
app.get('/weather', async (req, res) => {
  const q = req.query.location;
  if (!q) return res.status(400).json({ error: 'Query ?location= required' });
  try {
    const data = await weatherLookup(q);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// root
app.get('/', (_req, res) => {
  res.redirect('/client.html');
});

app.listen(PORT, () => console.log(`Server listening on :${PORT}`));
