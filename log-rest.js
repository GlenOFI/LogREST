// Most of this code is courtesy of: https://www.moesif.com/blog/technical/logging/How-we-built-a-Nodejs-Middleware-to-Log-HTTP-API-Requests-and-Responses/

// To run, open a command line in the same folder as this file, then run: node log-rest.js
const port = 8888;

const http = require("http");

const server = http.createServer((request, response) => {
    const requestStart = Date.now();

    let body = [];
    let requestErrorMessage = null;

    response.write("{}");

    // Set CORS headers
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Request-Method', '*');
    if (request.method === 'OPTIONS') {
        response.writeHead(200);
        response.end();
        return;
    }

    const getChunk = chunk => body.push(chunk);
    const assembleBody = () => {
        body = Buffer.concat(body).toString();
    };
    const getError = error => {
        requestErrorMessage = error.message;
    };
    request.on("data", getChunk);
    request.on("end", assembleBody);
    request.on("error", getError);

    const logClose = () => {
        removeHandlers();
        log(request, response, "Client aborted.", requestStart);
    };
    const logError = error => {
        removeHandlers();
        log(request, response, error.message, requestStart);
    };
    const logFinish = () => {
        removeHandlers();
        log(request, response, requestErrorMessage, requestStart);
    };
    response.on("close", logClose);
    response.on("error", logError);
    response.on("finish", logFinish);

    const removeHandlers = () => {
        request.off("data", getChunk);
        request.off("end", assembleBody);
        request.off("error", getError);
        response.off("close", logClose);
        response.off("error", logError);
        response.off("finish", logFinish);
    };

    process(request, response);
});

const log = (request, response, errorMessage, requestStart) => {
    const { rawHeaders, httpVersion, method, socket, url } = request;
    const { remoteAddress, remoteFamily } = socket;

    const { statusCode, statusMessage } = response;
    const headers = response.getHeaders();

    console.log(
        JSON.stringify({
            timestamp: Date.now(),
            processingTime: Date.now() - requestStart,
            rawHeaders,
            // body,
            errorMessage,
            httpVersion,
            method,
            remoteAddress,
            remoteFamily,
            url,
            response: {
                statusCode,
                statusMessage,
                headers
            }
        }, null, 3)
    );
};

const process = (request, response) => {
    setTimeout(() => {
        response.end();
    }, 100);
}

server.listen(port);
console.log("Listening on port: " + port);