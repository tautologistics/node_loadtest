var sys = require('sys');
var http = require('http');
var repl = require('repl');

var serverPort = 8080;
var connCount = 0;
var connCountTotal = 0;
var countReportDelay = 5 * 1000;
var resDelay = 15 * 1000;

function  handleConnClose () {
	connCount--;
}

function handleConnOpen (conn) {
	connCountTotal++;
	connCount++;
	conn.addListener("close", handleConnClose);
}

function formatConnStat () {
	var memInfo = process.memoryUsage();
	return("NOW: " + Math.round(new Date().getTime() / 1000)
		+ " | OC: " + connCount
		+ " | TC: " + connCountTotal
		+ " | RS: " + memInfo.rss
		+ " | VS: " + memInfo.vsize
		+ " | HT: " + memInfo.heapTotal
		+ " | HU: " + memInfo.heapUsed
		);
}

function connStat () {
	sys.puts(formatConnStat());
}

function handleRequest (req, res) {
	res.sendHeader(200, {'Content-Type': 'text/plain'});
	res.sendBody('x');
	res.finish();
}

process.addListener("SIGINT", function () {
	sys.puts("Quitting. " + connCountTotal + " connections received");
	process.exit(0);
});

var server = http.createServer(function(req, res) {
	if (req.uri.full.toLowerCase() == "/cstat") {
		res.sendHeader(200, {'Content-Type': 'text/plain'});
		res.sendBody(formatConnStat());
		res.finish();
	} else {
		setTimeout(function () { handleRequest(req, res); }, resDelay)
	}
})
server.addListener("connection", handleConnOpen);
server.listen(8080);

//*/
setInterval(connStat, countReportDelay);
/*/
repl.scope.cstat = connStat;
repl.start();
//*/

sys.puts("Listening on port " + serverPort + " with a response delay of " + (resDelay / 1000) + "sec");
