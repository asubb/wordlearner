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
            var files = $(filesContainer + " .body");
            for (var i = 0; i < res.items.length; i++) {
                var item = res.items[i]
                var actor = $(document.createElement("a"));
                actor.attr("href", "JavaScript:void(0)");
                actor.attr("class", "list-group-item");
                actor.bind("click", item.id, function (evt) {
                    setFile(evt.data);
                });
                actor.text(item.title);

                files.append(actor);
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
    var getContent = function (item) {
        var content = "";
        content += '<div class="panel panel-info">';
        content += '    <div class="panel-heading">';
        content += '       <h3 class="panel-title">' + item.word + '</h3>';
        content += '    </div>';
        content += '    <div class="panel-body">';
        content += '    ' + item.definition;
        content += '    </div>';
        content += '</div>';
        return content;
    };

    var idx = 0;

    var render = function() {
        $("#body").html(getContent(dictionary[idx]));
    };
    render();
    $("#prevBtn").removeAttr("disabled");

    $("#nextBtn").css("visibility", "visible");
    $("#prevBtn").css("visibility", "visible");
    setActiveButton("#learnBtn");

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
    var getContent = function (item) {
        var content = "";
        content += '<div class="panel panel-info">';
        content += '    <div class="panel-heading">';
        content += '       <h3 class="panel-title">' + item.word + '</h3>';
        content += '    </div>';
        content += '    <div class="panel-body">';
        content += '    ' + item.definition;
        content += '    </div>';
        content += '</div>';
        return content;
    };

    var shuffledDictionary = shuffleDictionary();
    var idx = 0;
    var render = function () {
        $("#body").html(getContent(shuffledDictionary[idx]));
    };
    render();

    $("#prevBtn").attr("disabled", "disabled");

    $("#nextBtn").css("visibility", "visible");
    $("#prevBtn").css("visibility", "visible");
    setActiveButton("#examineBtn");

    $("#nextBtn").bind("click", function () {
        idx++;
        if (idx >= shuffledDictionary.length) {
            $("#body").html("<h1>That's it</h1>");
        } else {
            render();
        }
    });
    $("#prevBtn").bind("click", function () {
    });
}

function shuffleDictionary() {
    var shuffledDictionary = [];
    _.each(dictionary, function (itm, idx) {
        shuffledDictionary[idx] = itm;
    });
    var count = Math.random() % 100 + dictionary.length;
    for (var i = 0; i < count; i++) {
        var k = Math.random() % shuffledDictionary.length;
        var l = Math.random() % shuffledDictionary.length;
        var t = shuffledDictionary[k];
        shuffledDictionary[k] = shuffledDictionary[l];
        shuffledDictionary[l] = t;
    }
    return shuffledDictionary;
}


function downloadFile(url) {
    console.log("url==", url);
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

function getFile(fileId) {
    return driveCall("GET", "/files/" + fileId);
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


function driveCall(method, path) {
    var q = $.Deferred();
    var accessToken = gapi.auth.getToken().access_token;
    var xhr = new XMLHttpRequest();
    xhr.open(method, "https://www.googleapis.com/drive/v2" + path);
    xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
    xhr.onload = function () {
        q.resolve(JSON.parse(xhr.responseText));
    };
    xhr.onerror = function () {
        console.error(xhr);
    };
    xhr.send();
    return q;
}
