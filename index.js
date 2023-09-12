const express = require('express');
const bodyParser = require('body-parser');
const {nanoid} = require('nanoid');
var dns = require('dns');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const urlSchema = new mongoose.Schema({
  original_url: { type: String, required: true },
  short_url: { type: String, required: true },
});

let Url = mongoose.model("Url", urlSchema);


// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.use(bodyParser.urlencoded({ extended: true }));

app.get('/api/shorturl/:shorturl', async (req, res) => {
  const result = await Url.find({short_url: req.params.shorturl});
  if(result[0]){
    res.redirect(result[0].original_url);
  }
  else res.json({ error: 'invalid url' });
});

app.post('/api/shorturl', async (req, res) => {
  let url = null;
  try {
    url = new URL(req.body.url);
    dns.lookup(url.host, async (err, addresses, family) => {
      if (err) {
        res.json({ error: 'invalid url' });
      }
      else{
        let entryExists = await Url.find({original_url: url.href}).select({_id:0,original_url:1, short_url:1 });
        if(entryExists[0]){
          res.json(entryExists[0]);
        }
        else{
          let randomShort = nanoid(5);
          while(await Url.exists({short_url: randomShort})){
            randomShort = nanoid(5);
          }
          let entry = new Url({ original_url: url.href, short_url: randomShort });
          entry.save();
          res.json({ original_url: url.href, short_url: randomShort });
        }
      }
    })
  } catch (err) {
    res.json({ error: 'invalid url' });
  }
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
