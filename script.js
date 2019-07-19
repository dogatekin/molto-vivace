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
const redirectUri = 'https://dogatekin.github.io/molto-vivace/'; //online
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
    getOAuthToken: cb => { cb(_token); }
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
    
    get_playlists()

    // Play a track using our new device ID
    // play(data.device_id);
  });

  // Connect to the player!
  player.connect();
  
//   get_tracks()
}

// Play a specified track on the Web Playback SDK's device ID
function play(device_id) {
  $.ajax({
   url: "https://api.spotify.com/v1/me/player/play?device_id=" + device_id,
   type: "PUT",
   data: '{"uris": ["spotify:track:7n92QzQomRCLlciO14X0kd"]}',
   beforeSend: function(xhr){xhr.setRequestHeader('Authorization', 'Bearer ' + _token );},
   success: function(data) { 
     console.log(data)
   }
  });
}

function get_playlists() {
  $.ajax({
    url: "https://api.spotify.com/v1/me/playlists?limit=50",
    type: "GET",
    beforeSend: function(xhr){xhr.setRequestHeader('Authorization', 'Bearer ' + _token );},
    success: function(data) { 
      var myDiv = document.getElementById("myDiv");

      //Create array of options to be added
      var playlists = data.items;
  
      //Create and append select list
      var selectList = document.createElement("select");
      selectList.setAttribute("id", "mySelect");
      selectList.setAttribute("onchange", "selectPlaylist();")
      selectList.setAttribute("onFocus", "this.selectedIndex = -1;")
      myDiv.appendChild(selectList);
  
      //Create and append the options
      for (let playlist of playlists) {
          var option = document.createElement("option");
          option.setAttribute("value", playlist.id);
          option.text = playlist.name;
          selectList.appendChild(option);
      }
    }
  });
}

function selectPlaylist() {
    let selectList = document.getElementById("mySelect");
    let selectedPlaylist = selectList.options[selectList.selectedIndex].value;
    get_tracks(selectedPlaylist);
}

function get_tracks(playlist_id="3Y2s9qvglOXfjEINuMkspX") {
    $.ajax({
      url: `https://api.spotify.com/v1/playlists/${playlist_id}/tracks`,
      type: "GET",
      beforeSend: function(xhr){xhr.setRequestHeader('Authorization', 'Bearer ' + _token );},
      success: function(data) { 
        playGame(data.items)
      }
    });
}

function playGame(tracks) {
    for (let track of tracks) {
        console.log(track.track.name)
    }
}