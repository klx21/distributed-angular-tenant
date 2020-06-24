const compression = require('compression');
const express = require('express');
const helmet = require('helmet');

const app = express();
const port = 3334;

app.use(helmet());
app.use(express.static('../client', {
  etag: true,
  maxAge: 3600 * 1000 // in milliseconds
}))
app.use(compression({
  filter: shouldCompress,
  level: -1,
  chunkSize: 4096
}));
app.listen(port, () => console.log(`The app is listening on port ${port}`));

function shouldCompress(req, res) {
  if (req.headers["x-no-compression"]) { // don't compress responses with this request header
    return false;
  }

  return compression.filter(req, res); // fallback to standard filter function
}
