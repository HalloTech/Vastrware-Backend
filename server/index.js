require("dotenv").config();
const cors = require("cors");
const http = require("http");
const app = require('./app');
const server = http.createServer(app);



const port = process.env.PORT || 3001;
server.listen(port, () => {
  console.log(`Backend Server listening on ${port}`);
});