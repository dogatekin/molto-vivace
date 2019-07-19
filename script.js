var playlists = [];
var trackList = [];

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

        getPlaylists()

        // Play a track using our new device ID
        // play(data.device_id);
    });

    // Connect to the player!
    player.connect();

    //   getTracks()
}

// Play a specified track on the Web Playback SDK's device ID
function play(device_id) {
    $.ajax({
        url: "https://api.spotify.com/v1/me/player/play?device_id=" + device_id,
        type: "PUT",
        data: '{"uris": ["spotify:track:7n92QzQomRCLlciO14X0kd"]}',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Authorization', 'Bearer ' + _token);
        },
        success: function (data) {
            console.log(data)
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
    selectList.setAttribute("id", "mySelect");
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
    let selectList = document.getElementById("mySelect");
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
                    async: false,  // Deprecated :(
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

function playGame() {
    let menu = document.getElementById("menu")
    menu.parentNode.removeChild(menu)

    for (let track of trackList) {
        console.log(track.track.name)
    }
}