const video = document.getElementById('webcam');
const detectBtn = document.getElementById('detectBtn');
const resultText = document.getElementById('emotionResult');
const musicDiv = document.getElementById('musicRecommendation');
const YOUTUBE_API_KEY = ''; // Replace this with your actual key

tf.setBackend('webgl').then(async () => {
  await tf.ready();
  await faceapi.nets.tinyFaceDetector.loadFromUri('/model/tiny_face_detector_model');
  await faceapi.nets.faceExpressionNet.loadFromUri('/model/face_expression_model');
  startVideo();
});

function startVideo() {
  navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
      video.srcObject = stream;
    })
    .catch(err => {
      console.error("Error accessing webcam:", err);
    });
}

detectBtn.addEventListener('click', async () => {
  const detection = await faceapi
    .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
    .withFaceExpressions();

  if (detection && detection.expressions) {
    const emotion = getDominantEmotion(detection.expressions);
    resultText.textContent = `Detected Emotion: ${emotion}`;
    resultText.classList.add('show');
    searchYouTubeMusic(emotion);
  } else {
    resultText.textContent = "No face detected!";
    resultText.classList.add('show');
    musicDiv.innerHTML = "";
  }
});

function getDominantEmotion(expressions) {
  return Object.entries(expressions).reduce((max, entry) => {
    return entry[1] > max[1] ? entry : max;
  })[0];
}

async function searchYouTubeMusic(emotion) {
  const query = `${emotion} mood music`;
  const apiURL = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=1&q=${encodeURIComponent(query)}&key=${YOUTUBE_API_KEY}`;

  try {
    const response = await fetch(apiURL);
    const data = await response.json();

    if (data.items && data.items.length > 0) {
      const videoId = data.items[0].id.videoId;
      const title = data.items[0].snippet.title;

      musicDiv.innerHTML = `
        <h3>🎵 Mood Music for: ${emotion.charAt(0).toUpperCase() + emotion.slice(1)}</h3>
        <p>${title}</p>
        <iframe width="320" height="180"
          src="https://www.youtube.com/embed/${videoId}"
          frameborder="0" allow="autoplay; encrypted-media" allowfullscreen>
        </iframe>
      `;
    } else {
      musicDiv.innerHTML = "<p>No music found for this mood.</p>";
    }
  } catch (error) {
    console.error("YouTube API Error:", error);
    musicDiv.innerHTML = "<p>Error fetching YouTube video.</p>";
  }
}
