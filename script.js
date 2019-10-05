var playlists = [];
var trackList = [];
var remaining;
var deviceID;
var correctAnswer;
var correctButton;
var correct = 0;
var total = 0;
var start;
var timeInterval;
var player;
var totalTime = 0;
var numOptions;
var numSongs;
var hardmode;

// Get the hash of the url
const hash = window.location.hash
    .substring(1)
    .split('&')
    .reduce(function (initial, item) {
        if (item) {
            var parts = item.split('=');
            initial[parts[0]] = decodeURIComponent(parts[1]);
        }
        return initial;
    }, {});
window.location.hash = '';

// Set token
let _token = hash.access_token;

const authEndpoint = 'https://accounts.spotify.com/authorize';

// Replace with your app's client ID, redirect URI and desired scopes
const clientId = '96e1183ff4d14390a4afd7902e2ac80d';
const redirectUri = 'https://dogatekin.github.io/molto-vivace/'; // online
// const redirectUri = 'http://localhost:8080/index.html'; // local
const scopes = [
    'streaming',
    'user-modify-playback-state'
];

// If there is no token, redirect to Spotify authorization
if (!_token) {
    window.location = `${authEndpoint}?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scopes.join('%20')}&response_type=token&show_dialog=true`;
}

// Set up the Web Playback SDK
window.onSpotifyPlayerAPIReady = () => {
    player = new Spotify.Player({
        name: 'Web Playback SDK Template',
        getOAuthToken: cb => {
            cb(_token);
        }
    });

    // Error handling
    player.on('initialization_error', e => console.error(e));
    player.on('authentication_error', e => console.error(e));
    player.on('account_error', e => console.error(e));
    player.on('playback_error', e => console.error(e));

    // Ready
    player.on('ready', data => {
        console.log('Ready with Device ID', data.device_id);
        deviceID = data.device_id

        getPlaylists()
    });

    // Connect to the player!
    player.connect();
}

// Play a specified track on the Web Playback SDK's device ID
function play(device_id, uri) {
    $.ajax({
        url: "https://api.spotify.com/v1/me/player/play?device_id=" + device_id,
        type: "PUT",
        data: `{"uris": ["${uri}"]}`,
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Authorization', 'Bearer ' + _token);
        }
    });
}

function appendPlaylists(newPlaylists) {
    playlists = playlists.concat(newPlaylists)
}

function getPlaylists() {
    $.ajax({
        async: false,
        url: "https://api.spotify.com/v1/me/playlists?limit=50",
        type: "GET",
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Authorization', 'Bearer ' + _token);
        },
        success: function (data) {
            let numPlaylists = data.total
            appendPlaylists(data.items);

            for (let i = 1; i < Math.ceil(numPlaylists / 50); i++) {
                $.ajax({
                    async: false,
                    url: `https://api.spotify.com/v1/me/playlists?limit=50&offset=${50*i}`,
                    type: "GET",
                    beforeSend: function (xhr) {
                        xhr.setRequestHeader('Authorization', 'Bearer ' + _token);
                    },
                    success: function (data) {
                        appendPlaylists(data.items);
                    }
                });
            }

            createMenu();
        }
    });
}

function createMenu() {
    var menu = document.getElementById("menu");

    //Create and append select list
    var selectList = document.createElement("select");
    selectList.setAttribute("id", "selectList");
    selectList.setAttribute("onchange", "selectPlaylist();")
    selectList.setAttribute("onFocus", "this.selectedIndex = -1;")
    menu.appendChild(selectList);

    //Create and append the options
    for (let playlist of playlists) {
        var option = document.createElement("option");
        option.setAttribute("value", playlist.id);
        option.text = `${playlist.owner.display_name} – ${playlist.name} (${playlist.tracks.total})`;
        selectList.appendChild(option);
    }
}

function selectPlaylist() {
    numOptions = document.getElementById("numOptions").value;
    numSongs = document.getElementById("numSongs").value;
    hardmode = document.getElementById("hardmode").checked;

    let form = document.getElementById("form")
    form.parentNode.removeChild(form)

    let selectList = document.getElementById("selectList");
    let selectedPlaylist = selectList.options[selectList.selectedIndex].value;
    getTracks(selectedPlaylist);
}

function appendTracks(tracks) {
    trackList = trackList.concat(tracks)
}

function getTracks(playlist_id = "3Y2s9qvglOXfjEINuMkspX") {
    $.ajax({
        url: `https://api.spotify.com/v1/playlists/${playlist_id}`,
        type: "GET",
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Authorization', 'Bearer ' + _token);
        },
        success: function (response) {
            let numTracks = response.tracks.total

            for (let i = 0; i < Math.ceil(numTracks / 100); i++) {
                $.ajax({
                    async: false,
                    url: `https://api.spotify.com/v1/playlists/${playlist_id}/tracks?offset=${100*i}`,
                    type: "GET",
                    beforeSend: function (xhr) {
                        xhr.setRequestHeader('Authorization', 'Bearer ' + _token);
                    },
                    success: function (data) {
                        appendTracks(data.items)
                    }
                });
            }

            playGame();
        }
    });
}

function shuffle(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}

function sample(choices, n) {
    let samples = []
    let copy = [...choices]

    while (n > 0) {
        let i = Math.floor(Math.random() * copy.length);
        samples.push(copy[i]);
        copy.splice(i, 1);
        n--;
    }

    return samples
}

function playGame() {
    let test = document.getElementById("test")
    let menu = document.getElementById("menu")
    let score = document.getElementById("score")
    let time = document.getElementById("time")

    test.style.textAlign = "center"
    menu.style.display = "inline-block"
    menu.style.textAlign = "left"

    score.innerHTML = "Score: 0 / 0"
    time.innerHTML = "Time: 0.0"

    remaining = [...trackList]

    if (numSongs == "All") {
        numSongs = remaining.length
    }

    timeInterval = setInterval(timer, 100);

    if (remaining.length > 0 && numSongs > 0) {
        nextSong()
    } else {
        console.log("There are no songs here!")
    }
}

function nextSong() {
    menu.innerHTML = "<p style='text-align:center;'>Which song is this?<br><br></p>"

    // Get a random song
    let index = Math.floor(Math.random() * remaining.length);
    let current = remaining[index]
    correctAnswer = `${current.track.artists[0].name} – ${current.track.name}`

    // Remove it so we don't see it again
    remaining.splice(index, 1)

    // Get three random choices except the correct one
    if (remaining.length >= numOptions - 1) {
        choices = sample(remaining, numOptions - 1)
    } else {
        copy = [...trackList]
        copy.splice(copy.indexOf(current), 1)
        choices = sample(copy, numOptions - 1)
    }

    // Add correct answer to the choices
    choices.push(current)

    // Shuffle the choices
    shuffle(choices)

    for (let choice of choices) {
        let option = document.createElement("a");
        option.style.width = "100%"
        option.className += "btn btn-lg btn-salmon"
        if (hardmode) {
            option.className += " hoverer"
        }
        option.innerHTML = `${choice.track.artists[0].name} – ${choice.track.name}`

        if (option.innerHTML == correctAnswer) {
            correctButton = option
        }

        option.setAttribute("onclick", "select(this)")
        menu.appendChild(option)

        menu.appendChild(document.createElement("br"))
        menu.appendChild(document.createElement("br"))
    }

    play(deviceID, current.track.uri)

    start = (new Date()).getTime();

    numSongs--;
}

function select(button) {
    if (hardmode) {
        button.style.opacity = "1";
        correctButton.style.opacity = "1";
        correctButton.style.transition = "opacity 0.75s"
    }

    let answer = button.innerHTML

    let now = (new Date()).getTime();
    totalTime += (now - start) / 1000

    if (answer == correctAnswer) {
        button.style.backgroundColor = "rgb(87,181,96)"
        correct++
    } else {
        button.style.backgroundColor = "darkred"
        correctButton.style.backgroundColor = "rgb(87,181,96)"
    }

    total++;

    setTimeout(function () {
        document.getElementById("score").innerHTML = `Score: ${correct} / ${total}`;

        // Clear and get ready for next song
        while (menu.firstChild) {
            menu.removeChild(menu.firstChild);
        }

        if (remaining.length > 0 && numSongs > 0) {
            nextSong()
        } else {
            clearInterval(timeInterval)

            let time = document.getElementById("time")
            time.innerHTML = `Total time: ${(Math.round((totalTime * 10)) / 10).toFixed(1)}`

            player.pause()
            player.disconnect()

            menu.innerHTML = "<h3>Congratulations!<br></h3>"
        }
    }, 1500)

}

function timer() {
    let now = (new Date()).getTime();
    document.getElementById("time").innerHTML = `Time: ${(Math.round(((now - start) / 1000) * 10) / 10).toFixed(1)}`;
}