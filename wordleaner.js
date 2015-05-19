var express = require('express');
var request = require('request');
var parse = require('csv-parse');
var $ = require('jquery-deferred');
var _ = require('underscore');


var app = express();
app.use(express.static('public'));

app.get('/downloadAndParse', function (req, res) {
    var url = req.query["url"];
    var accessToken = req.query["accessToken"];
    request({
        url: url,
        headers: {
            'Authorization': 'Bearer ' + accessToken
        }
    }, function (error, response, body) {
        if (!error) {
            parseDictionary(body)
                .then(function (output) {
                    res.status(response.statusCode).send(JSON.stringify(output));
                });
        } else {
            res.status(500).send(error);
        }
    })
});

var parseDictionary = function (content) {
    var deferred = $.Deferred();

    var output = [];
    // Create the parser
    var parser = parse({delimiter: ','});

    // Use the writable stream api
    parser.on('readable', function () {
        var record;
        while (record = parser.read()) {
            output.push(record);
        }
    });

    parser.on('finish', function () {
        var out = [];
        _.each(output, function (itm, idx) {
            var word = itm[0];
            if (word != '' && word != 'Word') {
                out.push({
                    word: word,
                    phonetics: itm[1],
                    definition: itm[2],
                    example: itm[3],
                    translation: itm[4]
                });
            }
        });
        deferred.resolve(out);
    });
    parser.write(content);
    parser.end();
    return deferred;
};

var server = app.listen(8081, function () {

    var host = server.address().address;
    var port = server.address().port;

    console.log('Example app listening at http://%s:%s', host, port);

});