var playlists = [];
var trackList = [];
var deviceID;
var correct_answer;
var correct = 0;
var total = 0;
var start;

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
    const player = new Spotify.Player({
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

    // Playback status updates
    //   player.on('player_state_changed', state => {
    //     console.log(state)
    //     $('#current-track').attr('src', state.track_window.current_track.album.images[0].url);
    //     $('#current-track-name').text(state.track_window.current_track.name);
    //   });

    // Ready
    player.on('ready', data => {
        console.log('Ready with Device ID', data.device_id);
        deviceID = data.device_id

        getPlaylists()

        // Play a track using our new device ID
        // play(data.device_id);
    });

    // Connect to the player!
    player.connect();

    //   getTracks()
}

// Play a specified track on the Web Playback SDK's device ID
function play(device_id, uri) {
    $.ajax({
        url: "https://api.spotify.com/v1/me/player/play?device_id=" + device_id,
        type: "PUT",
        data: `{"uris": ["${uri}"]}`,
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Authorization', 'Bearer ' + _token);
        },
        success: function (data) {
            // console.log(data)
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
        option.text = `${playlist.owner.display_name} – ${playlist.name}`;
        selectList.appendChild(option);
    }
}

function selectPlaylist() {
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
                    async: false, // Deprecated :(
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
    let menu = document.getElementById("menu");
    menu.innerHTML = "Which song is this?<br><br>"
    
    setInterval(timer, 100);
    
    nextSong()
}

function nextSong() {
    // Get a random song
    let index = Math.floor(Math.random() * trackList.length);
    let current = trackList[index]
    correct_answer = `${current.track.artists[0].name} – ${current.track.name}`

    // Remove it so we don't see it again
    trackList.splice(index, 1)

    // Get three random choices except the correct one
    choices = sample(trackList, 3)

    // Add correct answer to the choices
    choices.push(current)

    // Shuffle the choices
    shuffle(choices)

    // Add selection box / buttons
    var dropdown = document.createElement("select");
    dropdown.setAttribute("id", "dropdown");
    dropdown.setAttribute("onchange", "selectAnswer();")
    dropdown.setAttribute("onFocus", "this.selectedIndex = -1;")
    menu.appendChild(dropdown);

    //Create and append the options
    for (let choice of choices) {
        var option = document.createElement("option");
        option.setAttribute("value", `${choice.track.artists[0].name} – ${choice.track.name}`);
        option.text = `${choice.track.artists[0].name} – ${choice.track.name}`;
        dropdown.appendChild(option);
    }

    play(deviceID, current.track.uri)

    start = (new Date()).getTime();
}

function selectAnswer() {
    let dropdown = document.getElementById("dropdown");
    let answer = dropdown.options[dropdown.selectedIndex].value;

    if (answer == correct_answer) {
        correct++
    }

    total++;

    document.getElementById("score").innerHTML = `Score: ${correct} / ${total}`;

    dropdown.parentNode.removeChild(dropdown)
    nextSong()
}

function timer() {
    let now = (new Date()).getTime();
    document.getElementById("time").innerHTML = `Time: ${(Math.round(((now - start) / 1000) * 10) / 10).toFixed(1)}`;
}