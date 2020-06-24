const compression = require('compression');
const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const path = require('path');

const app = express();
const port = 3334;
const corsOptions = {
  origin: 'http://localhost:3333'
};

/* Secure the app by setting various HTTP headers */
app.use(helmet());

/* Serving static resources */
app.use(cors(corsOptions), express.static('../client', {
  etag: true,
  maxAge: 3600 * 1000 // in milliseconds
}))

/* Fallback to index.html for unmatched GET requests */
app.get('*', (request, response) => {
  response.sendFile(path.resolve('../client/index.html'));
})

/* Gzip resources before sending them back */
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
