var sys = require('sys');
var http = require('http');
var repl = require('repl');

var serverPort = 8080;
var serverHost = 'localhost';
var serverPath = '/';
var clientCreationDelay = 0.01 * 1000;
var reportDelay = 5 * 1000;
var clientLimit = 1000;
var responseCount = 0;
var clients = [];
 
function getTimestamp () {
	return(Math.round(new Date().getTime() / 1000));
}

function handleClientConnect () { }

function handleClientClose (self) {
	if (self.loop)
		self.request(serverPath, { "Host": serverHost })
			.addListener("response", handleRequestFinish);
}

function handleResponseBody (chunk) { }

function handleRequestFinish (res) {
	res.addListener('complete', handleResponseComplete);
}

function handleResponseComplete () {
	responseCount++;
}

function formatStats () {
	var memInfo = process.memoryUsage();
	return('LIMIT: ' + clientLimit
		+ ' | CONN: ' + clients.length
		+ ' | RESP: ' + responseCount
		+ " | RS: " + memInfo.rss
		+ " | VS: " + memInfo.vsize
		+ " | HT: " + memInfo.heapTotal
		+ " | HU: " + memInfo.heapUsed
		);
}

process.addListener("SIGINT", function () {
	sys.puts("Quitting. " + formatStats());
	process.exit(0);
});

function checkClientCount () {
	if (clients.length < clientLimit) {
		var client = http.createClient(serverPort, serverHost)
			//.addListener('connect', handleClientConnect)
			.addListener('close', function () { handleClientClose(client) });
		clients.push(client);
		client.loop = true;
		handleClientClose(client);
		//sys.puts('Client added');
	}
	else if (clients.length > clientLimit) {
		var client = clients.pop();
		client.loop = false;
		/* Arg@! Doesn't work...
		var handlers = client.listeners('close');
		sys.puts("DEB: " + handlers.length);
		for (var handler in handlers)
			client.removeListener('close', handler);
		*/
		//sys.puts('Client removed');
	}
	if (clients.length != clientLimit)
		setTimeout(checkClientCount, clientCreationDelay);
}

function add (count) {
	clientLimit += count || 1;
	if (clientLimit < 0)
		clientLimit = 0;
	checkClientCount();
}

function rem (count) {
	clientLimit -= count || 1;
	if (clientLimit < 0)
		clientLimit = 0;
	checkClientCount();
}

setInterval(function() {
  sys.puts(formatStats());
}, reportDelay);

sys.puts("Starting clients to load test http://" + serverHost + ":" + serverPort + serverPath);

checkClientCount();

var replConext = repl.start().context
replConext.add = add;
replConext.rem = rem;

