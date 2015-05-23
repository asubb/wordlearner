var dictionaryFileId = null;
var mainContainer = "#content";
var filesContainer = "#files";
var dictionary = [];

$(document).ready(function () {
    var mode = {};
    $("#nextBtn").css("visibility", "hidden");
    $("#prevBtn").css("visibility", "hidden");

    $("#learnBtn").bind("click", function() {
        learnDictionary();
    });
    $("#examineBtn").bind("click", function() {
        examineDictionary();
    });
});

function startApp() {
    if (!dictionaryFileId) {
        $(filesContainer).css("display", "block");
        $(mainContainer).css("display", "none");
        list().then(function (res) {
            console.log(res);
            var files = $(filesContainer + " .body");
            var createItem = function (item, parent) {
                var actor = $(document.createElement("a"));
                actor.attr("href", "JavaScript:void(0)");
                actor.attr("class", "list-group-item");
                actor.bind("click", item.id, function (evt) {
                    setFile(evt.data);
                });
                if (parent) {
                    actor.html(parent.title + " &gt; " + "<b>" + item.title + "</b>");
                } else {
                    actor.html(item.title);
                }

                files.append(actor);
            };

            for (var i = 0; i < res.items.length; i++) {
                var item = res.items[i]
                // retrieve 1st parent
                if (item.parents[0]) {
                    getFile(item.parents[0].id, item).then(function (parent, item) {
                        createItem(item, parent);
                    })
                } else {
                    createItem(item, null);
                }
            }
        });
    }
}

function setFile(id) {
    dictionaryFileId = id;

    readDictionary();
}


function readDictionary() {
    getFile(dictionaryFileId).then(function (res) {
        downloadFile(res.exportLinks['text/csv']).then(function (res) {
            $(filesContainer).css("display", "none");
            $(mainContainer).css("display", "block");
            dictionary = JSON.parse(res);
            learnDictionary();
        });
    });
}

var setActiveButton  = function(btn){
    $("#learnBtn").parent().removeClass("active");
    $("#examineBtn").parent().removeClass("active");
    $(btn).parent().addClass("active");
};

var learnDictionary = function () {
    var idx = 0;

    var render = function() {
        var item = dictionary[idx];
        var content = "";
        if (item.phonetics.trim() != '') {
            content += '<div><b>Phonetics:</b> ' + item.phonetics + '</div>';
        }
        if (item.definition.trim() != '') {
            content += '<div><b>Definition:</b> ' + item.definition + '</div>';
        }
        if (item.example.trim() != '') {
            content += '<div><b>Example:</b> ' + item.example + '</div>';
        }
        if (item.translation.trim() != '') {
            content += '<div><b>Translation:</b> ' + item.translation + '</div>';
        }
        $("#body").html(content);
        $("#title").html(item.word);
    };
    render();

    $("#nextBtn").css("visibility", "visible");
    $("#prevBtn").css("visibility", "visible");
    setActiveButton("#learnBtn");
    $("#nextBtn").unbind("click")
    $("#prevBtn").unbind("click")
    $("#nextBtn").bind("click", function () {
        idx = (idx + 1) % dictionary.length;
        render();
    });
    $("#prevBtn").bind("click", function () {
        idx = idx - 1 < 0 ? dictionary.length - 1 : idx - 1;
        render();
    });

};

function examineDictionary() {
    var shuffledDictionary = shuffle(dictionary);
    var idx = 0;
    var render = function () {
        var item = shuffledDictionary[idx];

        var puzzleOptions = [];
        var content = "";
        content += '<div class="blurred" id="solution">';
        if (item.word.trim() != '') {
            content += '<div><b>Word:</b> ' + item.word + '</div>';
        }
        if (item.phonetics.trim() != '') {
            content += '<div><b>Phonetics:</b> ' + item.phonetics + '</div>';
        }
        if (item.definition.trim() != '') {
            content += '<div><b>Definition:</b> ' + item.definition + '</div>';
            puzzleOptions.push(item.definition);
        }
        if (item.example.trim() != '') {
            content += '<div><b>Example:</b> ' + item.example + '</div>';
        }
        if (item.translation.trim() != '') {
            content += '<div><b>Translation:</b> ' + item.translation + '</div>';
            puzzleOptions.push(item.translation);
        }
        content += '    </div>';
        content += '    <div class="row text-center"><button type="button" onclick="$(\'#solution\').removeClass(\'blurred\');" class="btn btn-lg btn-success margin5">Verify</button></div>';
        content += '</div>';
        $("#body").html(content);
        var puzzle = puzzleOptions[rndInt(puzzleOptions.length)];
        $("#title").html(puzzle);
    };
    render();


    $("#nextBtn").css("visibility", "visible");
    $("#prevBtn").css("visibility", "visible");
    setActiveButton("#examineBtn");
    $("#nextBtn").unbind("click")
    $("#prevBtn").unbind("click")
    $("#nextBtn").bind("click", function () {
        idx++;
        if (idx >= shuffledDictionary.length) {
            $("#body").html("<h1>That's it</h1>");
        } else {
            render();
        }
    });
    $("#prevBtn").bind("click", function () {
        idx--;
        if (idx < 0) {
            idx = 0;
        } else {
            render();
        }
    });
}

function rndInt(maxValue) {
    return Math.round(Math.random() * 123786481243) % maxValue;
}

function shuffle(a) {
    var shuffled = [];
    _.each(a, function (itm, idx) {
        shuffled[idx] = itm;
    });

    var count = rndInt(100) + dictionary.length;
    for (var i = 0; i < count; i++) {
        var k = rndInt(shuffled.length);
        var l = rndInt(shuffled.length);
        var t = shuffled[k];
        shuffled[k] = shuffled[l];
        shuffled[l] = t;
    }
    return shuffled;
}


function downloadFile(url) {
    var q = $.Deferred();
    var accessToken = gapi.auth.getToken().access_token;
    var xhr = new XMLHttpRequest();
    xhr.open('GET', "/downloadAndParse?url=" + encodeURIComponent(url) + "&accessToken=" + accessToken);
    xhr.onload = function () {
        q.resolve(xhr.responseText);
    };
    xhr.onerror = function () {
        console.error(xhr);
    };
    xhr.send();
    return q;
}

    function getFile(fileId, param) {
        return driveCall("GET", "/files/" + fileId, param);
    }

function list() {
    return driveCall("GET", "/files?q=" + encodeURI("mimeType='application/vnd.google-apps.spreadsheet' and trashed=false"));
}


//** GOOGLE DRIVE APIs handles **//
var CLIENT_ID = '846054987265-p8j31vpch27jd1ko8usnif92cgrrut76.apps.googleusercontent.com';
var SCOPES = 'https://www.googleapis.com/auth/drive.readonly';

/**
 * Called when the client library is loaded to start the auth flow.
 */
function handleClientLoad() {
    window.setTimeout(checkAuth, 1);
}

/**
 * Check if the current user has authorized the application.
 */
function checkAuth() {
//    gapi.auth.authorize(
//        {'client_id': CLIENT_ID, 'scope': SCOPES, 'immediate': true},
//        handleAuthResult);
    handleAuthResult(null);
}

/**
 * Called when authorization server replies.
 *
 * @param {Object} authResult Authorization result.
 */
function handleAuthResult(authResult) {
    var authButton = document.getElementById('authorizeButton');
    authButton.style.display = 'none';
    if (authResult && !authResult.error) {
        // Access token has been successfully retrieved, requests can be sent to the API.
        startApp();
    } else {
        // No access token could be retrieved, show the button to start the authorization flow.
        authButton.style.display = 'block';
        authButton.onclick = function () {
            gapi.auth.authorize(
                {'client_id': CLIENT_ID, 'scope': SCOPES, 'immediate': false, 'authuser': -1},
                handleAuthResult);
        };
    }
}


    function driveCall(method, path, param) {
    var q = $.Deferred();
    var accessToken = gapi.auth.getToken().access_token;
    var xhr = new XMLHttpRequest();
    xhr.open(method, "https://www.googleapis.com/drive/v2" + path);
    xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
    xhr.onload = function () {
        q.resolve(JSON.parse(xhr.responseText), param);
    };
    xhr.onerror = function () {
        console.error(xhr);
    };
    xhr.send();
    return q;
}
