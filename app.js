(function () {
  "use strict";

  var micBtn = document.getElementById("mic-btn");
  var micLabel = document.getElementById("mic-label");
  var micIcon = document.getElementById("mic-icon");
  var micStatus = document.getElementById("mic-status");
  var micSupport = document.getElementById("mic-support");
  var heardText = document.getElementById("heard-text");
  var decodedText = document.getElementById("decoded-text");
  var clearHeardBtn = document.getElementById("clear-heard");
  var copyDecodedBtn = document.getElementById("copy-decoded");
  var encodeInput = document.getElementById("encode-input");
  var encodeOutput = document.getElementById("encode-output");

  var dictionary = new Set();

  fetch("data/words.json")
    .then(function (res) { return res.json(); })
    .then(function (words) {
      dictionary = new Set(words);
      runDecode();
    })
    .catch(function () {
      // Decoding still works without the dictionary, just with less accurate
      // merging of multi-syllable words that got split across tokens.
    });

  function runDecode() {
    var decoded = Ithig.decode(heardText.value, dictionary);
    decodedText.value = decoded;
  }

  function runEncode() {
    encodeOutput.value = Ithig.encode(encodeInput.value);
  }

  heardText.addEventListener("input", runDecode);
  encodeInput.addEventListener("input", runEncode);

  clearHeardBtn.addEventListener("click", function () {
    heardText.value = "";
    decodedText.value = "";
    heardText.focus();
  });

  copyDecodedBtn.addEventListener("click", function () {
    if (!decodedText.value) return;
    navigator.clipboard.writeText(decodedText.value).catch(function () {});
  });

  // --- Speech recognition ---------------------------------------------

  var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  var recognition = null;
  var listening = false;
  var finalTranscript = "";

  if (!SpeechRecognition) {
    micSupport.hidden = false;
    micBtn.disabled = true;
    micStatus.textContent = "Speech recognition unavailable";
  } else {
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = function (event) {
      var interim = "";
      for (var i = event.resultIndex; i < event.results.length; i++) {
        var transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
        } else {
          interim += transcript;
        }
      }
      heardText.value = (finalTranscript + interim).trim();
      runDecode();
    };

    recognition.onerror = function (event) {
      micStatus.textContent = "Mic error: " + event.error;
    };

    recognition.onend = function () {
      if (listening) {
        // Browsers auto-stop after periods of silence; restart while the
        // user still has the mic toggled on.
        try {
          recognition.start();
        } catch (e) {
          stopListening();
        }
      }
    };

    micBtn.addEventListener("click", function () {
      if (listening) {
        stopListening();
      } else {
        startListening();
      }
    });
  }

  function startListening() {
    finalTranscript = heardText.value ? heardText.value + " " : "";
    try {
      recognition.start();
    } catch (e) {
      return;
    }
    listening = true;
    micBtn.classList.add("listening");
    micIcon.textContent = "⏹"; // stop icon
    micLabel.textContent = "Stop Listening";
    micStatus.textContent = "Listening...";
  }

  function stopListening() {
    listening = false;
    try {
      recognition.stop();
    } catch (e) {}
    micBtn.classList.remove("listening");
    micIcon.textContent = "🎤"; // mic icon
    micLabel.textContent = "Start Listening";
    micStatus.textContent = "Mic is off";
  }
})();
