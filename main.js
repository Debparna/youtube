// Options
const CLIENT_ID = '610238259195-faicttc4up4m4d3d91n8a38kfl68r2ep.apps.googleusercontent.com';
const DISCOVERY_DOCS = [
  'https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest'
];

const SCOPES = 'https://www.googleapis.com/auth/youtube.force-ssl';

const authorizeButton = document.getElementById('authorize-button');
const signoutButton = document.getElementById('signout-button');
const content = document.getElementById('content');
const channelForm = document.getElementById('channel-form');
const channelInput = document.getElementById('channel-input');
const videoContainer = document.getElementById('video-container');
const commentForm = document.getElementById('comment-form');
const commentContainer= document.getElementById('comment-container');
const commentInput = document.getElementById('comment-input');

const defaultChannel = 'techguyweb';
const defaultVideo = 'J2X5mJ3HDYE';

// Form submit and change channel
channelForm.addEventListener('submit', e => {
  e.preventDefault();
  const channel = channelInput.value;
  getChannel(channel);
});

commentForm.addEventListener('submit', e => {
  e.preventDefault();
  const videoID = commentInput.value;
  //getVideoComments(videoID);
});

// Load auth2 library
function handleClientLoad() {
  gapi.load('client:auth2', initClient);
}

// Init API client library and set up sign in listeners
function initClient() {
  gapi.client
    .init({
      discoveryDocs: DISCOVERY_DOCS,
      clientId: CLIENT_ID,
      scope: SCOPES
    })
    .then(() => {
      // Listen for sign in state changes
      gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
      // Handle initial sign in state
      updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
      authorizeButton.onclick = handleAuthClick;
      signoutButton.onclick = handleSignoutClick;
    });
}

// Update UI sign in state changes
function updateSigninStatus(isSignedIn) {
  if (isSignedIn) {
    authorizeButton.style.display = 'none';
    signoutButton.style.display = 'block';
    content.style.display = 'block';
    videoContainer.style.display = 'block';
    getChannel(defaultChannel);
  //  getVideoComments(defaultVideo);
  } else {
    authorizeButton.style.display = 'block';
    signoutButton.style.display = 'none';
    content.style.display = 'none';
    videoContainer.style.display = 'none';
  }
}

// Handle login
function handleAuthClick() {
  gapi.auth2.getAuthInstance().signIn();
}

// Handle logout
function handleSignoutClick() {
  gapi.auth2.getAuthInstance().signOut();
}

// Display channel data
function showChannelData(data) {
  const channelData = document.getElementById('channel-data');
  channelData.innerHTML = data;
}

// Get channel from API
function getChannel(channel) {
  gapi.client.youtube.channels
    .list({
      part: 'snippet,contentDetails,statistics',
      forUsername: channel
    })
    .then(response => {
      console.log(response);
      const channel = response.result.items[0];

      const output = `
        <ul class="collection">
          <li class="collection-item">Title: ${channel.snippet.title}</li>
          <li class="collection-item">ID: ${channel.id}</li>
          <li class="collection-item">Subscribers: ${numberWithCommas(
            channel.statistics.subscriberCount
          )}</li>
          <li class="collection-item">Views: ${numberWithCommas(
            channel.statistics.viewCount
          )}</li>
          <li class="collection-item">Videos: ${numberWithCommas(
            channel.statistics.videoCount
          )}</li>
        </ul>
        <p>${channel.snippet.description}</p>
        <hr>
        <a class="btn grey darken-2" target="_blank" href="https://youtube.com/${
          channel.snippet.customUrl
        }">Visit Channel</a>
      `;
      showChannelData(output);

      const playlistId = channel.contentDetails.relatedPlaylists.uploads;
      requestVideoPlaylist(playlistId);
    })
    .catch(err => alert('No Channel By That Name'));
}

// Add commas to number
function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function requestVideoPlaylist(playlistId) {
  const requestOptions = {
    playlistId: playlistId,
    part: 'snippet',
    maxResults: 10
  };

  const request = gapi.client.youtube.playlistItems.list(requestOptions);

  request.execute(response => {
    console.log(response);
    const playListItems = response.result.items;
    if (playListItems) {
      let output = '<br><h4 class="center-align">Latest Videos</h4>';

      // Loop through videos and append output
      playListItems.forEach(item => {
        const videoId = item.snippet.resourceId.videoId;
        getVideoComments(videoId);
        //console.log(comments);
        output += `
          <div class="col s3">
            <iframe width="100%" height="auto" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>
          </div>
        `;
      });

      // Output videos
      videoContainer.innerHTML = output;
    } else {
      videoContainer.innerHTML = 'No Uploaded Videos';
    }
  });
}

// Get comments from API
function getVideoComments(videoId) {
  const request =  gapi.client.youtube.commentThreads.list({
    part: 'snippet',
    videoId: videoId,
    key: 'AIzaSyDfl_ATe1VDf_x5_GRxR-n_PSV3hvBQxmk'
  })
  .then(response => {
    const videoComments = response.result.items;

    let out = '<br><h4 class="center-align">Comments </h4>';

     for(var i = 0; i < videoComments.length; i++){
       const videoID = videoComments[i].snippet.topLevelComment.id;
       out += `
          <p>
            <img class= "rounded-circle" src= "${videoComments[i].snippet.topLevelComment.snippet.authorProfileImageUrl}">
            <a href = "${videoComments[i].snippet.topLevelComment.snippet.authorChannelUrl}" target="_blank" >
              <h5> ${videoComments[i].snippet.topLevelComment.snippet.authorDisplayName} </h5>
            </a>
          </p>
          <p> ${videoComments[i].snippet.topLevelComment.snippet.textDisplay} </p>
          <div>
            <input type="text" placeholder="Enter Comment" id="comment-input">
            <button class="btn grey" onclick="execute(${videoId})">Reply</button>
            <br>
          </div>
       `;
       console.log(videoID);
     }
     commentContainer.innerHTML = out;
  })
}

function execute(videoId) {
  return gapi.client.youtube.comments.insert({
    "part": [
      "snippet"
    ],
    "resource": {
      "snippet": {
        "parentId": videoId,
        "textOriginal": "This is the original comment."
      }
    }
  })
      .then(function(response) {
              // Handle the results here (response.result has the parsed body).
              console.log("Response", response);
            },
            function(err) { console.error("Execute error", err); });
}
