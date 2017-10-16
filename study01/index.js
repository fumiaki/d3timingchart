console.log("Hello Node and Docker!");

const http = require("http");
const PORT = 8080;

http.createServer((req, res) => {
	res.writeHead(200, {"Content-Type":"text/html"});
	res.end("Hello Node on Docker !!");
}).listen(PORT);

console.log("Server running at port " + PORT);
