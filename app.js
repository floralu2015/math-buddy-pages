let sessionId = null;
let isListening = false;
let wantToListen = false; // User's intent to keep listening
let recognition = null;
let synthesis = window.speechSynthesis;
let selectedVoice = null;
let currentTranscript = ''; // Accumulate speech across restarts
let silenceTimer = null;
let useOpenAITTS = false; // Will be set to true if OpenAI TTS is available
let useWhisper = false; // Use Whisper for speech-to-text on mobile
let mediaRecorder = null;
let audioChunks = [];
let voiceEnabled = true; // Voice mode toggle

const messagesDiv = document.getElementById('messages');
const micBtn = document.getElementById('mic-btn');
const textInput = document.getElementById('text-input');
const sendBtn = document.getElementById('send-btn');
const textbookUpload = document.getElementById('textbook-upload');
const workUpload = document.getElementById('work-upload');
const imagePreview = document.getElementById('image-preview');
const pendingImagesInfo = document.getElementById('pending-images-info');
const analyzeBtn = document.getElementById('analyze-btn');
const newSessionBtn = document.getElementById('new-session-btn');
const mascot = document.getElementById('mascot');
const audioControlRow = document.getElementById('audio-control-row');
const audioBtn = document.getElementById('audio-btn');
const voiceToggle = document.getElementById('voice-toggle');

let pendingImages = { textbook: [], work: [] };
let audioUnlocked = false;
let warmAudio = null; // "Blessed" audio element for iOS

// Voice toggle functionality
voiceToggle.addEventListener('click', () => {
  voiceEnabled = !voiceEnabled;
  updateVoiceToggleUI();

  // Stop any playing audio when turning voice off
  if (!voiceEnabled) {
    stopAudio();
  }

  // Save preference to localStorage
  localStorage.setItem('voiceEnabled', voiceEnabled);
});

function updateVoiceToggleUI() {
  if (voiceEnabled) {
    voiceToggle.classList.remove('voice-off');
    voiceToggle.querySelector('.voice-icon').textContent = '🔊';
    voiceToggle.querySelector('.voice-label').textContent = 'Voice On';
  } else {
    voiceToggle.classList.add('voice-off');
    voiceToggle.querySelector('.voice-icon').textContent = '🔇';
    voiceToggle.querySelector('.voice-label').textContent = 'Voice Off';
  }
}

// Load voice preference from localStorage
const savedVoicePref = localStorage.getItem('voiceEnabled');
if (savedVoicePref !== null) {
  voiceEnabled = savedVoicePref === 'true';
  updateVoiceToggleUI();
}

// Detect if we should use Whisper (mobile/iOS)
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

function detectWhisperMode() {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  // Web Speech API doesn't work reliably on iOS Safari
  if (isIOS || (isMobile && !('webkitSpeechRecognition' in window))) {
    useWhisper = true;
    console.log('Using Whisper for speech-to-text (mobile detected)');
  }
}
detectWhisperMode();

// Create a "warm" audio element during user interaction - iOS will allow this element to play later
function unlockAudio() {
  if (audioUnlocked) return;

  // Create and "bless" an audio element by playing silent audio during user gesture
  warmAudio = new Audio();
  warmAudio.playsInline = true;
  warmAudio.muted = false;

  // Tiny silent WAV
  warmAudio.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';

  const playPromise = warmAudio.play();
  if (playPromise !== undefined) {
    playPromise.then(() => {
      audioUnlocked = true;
      console.log('Audio element blessed for iOS');
    }).catch(e => {
      console.log('Could not bless audio:', e);
    });
  }
}

// Check if OpenAI TTS is available
async function checkOpenAITTS() {
  try {
    const response = await fetch('/api/tts-check');
    const data = await response.json();
    useOpenAITTS = data.available;
    console.log('OpenAI TTS available:', useOpenAITTS);
  } catch (e) {
    useOpenAITTS = false;
  }
}
checkOpenAITTS();

// Load and select the best female voice (fallback)
function loadVoices() {
  const voices = synthesis.getVoices();
  if (voices.length === 0) return;

  const preferredVoices = [
    'Samantha (Enhanced)',
    'Samantha',
    'Karen (Enhanced)',
    'Karen',
    'Moira (Enhanced)',
    'Moira',
    'Tessa (Enhanced)',
    'Tessa',
    'Fiona (Enhanced)',
    'Fiona'
  ];

  for (const name of preferredVoices) {
    const voice = voices.find(v => v.name === name);
    if (voice) {
      selectedVoice = voice;
      console.log('Selected fallback voice:', voice.name);
      break;
    }
  }

  if (!selectedVoice) {
    selectedVoice = voices.find(v =>
      v.lang.startsWith('en') &&
      (v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Karen'))
    ) || voices.find(v => v.lang.startsWith('en'));
  }
}

loadVoices();
if (synthesis.onvoiceschanged !== undefined) {
  synthesis.onvoiceschanged = loadVoices;
}

// Initialize speech recognition - CONTINUOUS mode
function initSpeechRecognition() {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    console.log('Speech recognition not supported');
    return false;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.continuous = true;  // Keep listening!
  recognition.interimResults = true;
  recognition.lang = 'en-US';
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    console.log('Speech recognition started');
    isListening = true;
    currentTranscript = '';
    micBtn.classList.add('listening');
    micBtn.querySelector('.mic-text').textContent = '🔴 Tap to Send';
    animateMascot('listening');
  };

  recognition.onresult = (event) => {
    let interimTranscript = '';
    currentTranscript = '';

    for (let i = 0; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        currentTranscript += transcript + ' ';
      } else {
        interimTranscript += transcript;
      }
    }

    // Show what's being heard
    const displayText = (currentTranscript + interimTranscript).trim();
    if (displayText) {
      const shortText = displayText.length > 40 ? '...' + displayText.slice(-40) : displayText;
      micBtn.querySelector('.mic-text').textContent = '🔴 ' + shortText;
    }

    // Reset silence timer on new speech
    clearTimeout(silenceTimer);
  };

  recognition.onend = () => {
    console.log('Speech recognition ended, wantToListen:', wantToListen);
    isListening = false;

    // If user still wants to listen, restart (browser stops after silence)
    if (wantToListen) {
      try {
        recognition.start();
        return;
      } catch (e) {
        console.log('Could not restart recognition:', e);
      }
    }

    // User tapped to stop - send the message if we have content
    if (currentTranscript.trim()) {
      sendMessage(currentTranscript.trim());
    }

    micBtn.classList.remove('listening');
    micBtn.querySelector('.mic-text').textContent = 'Tap to Talk 🎤';
    animateMascot('idle');
    currentTranscript = '';
  };

  recognition.onerror = (event) => {
    console.error('Speech error:', event.error);

    // 'no-speech' is not fatal - just means silence, keep going if user wants
    if (event.error === 'no-speech' && wantToListen) {
      return; // Don't stop, let onend restart it
    }

    if (event.error === 'not-allowed') {
      wantToListen = false;
      isListening = false;
      micBtn.classList.remove('listening');
      micBtn.querySelector('.mic-text').textContent = 'Please allow microphone! 🎤';
      showMicPermissionHelp();
      animateMascot('confused');
    } else if (event.error === 'aborted') {
      // User stopped intentionally, this is fine
    } else {
      console.log('Speech error (non-fatal):', event.error);
    }
  };

  return true;
}

function showMicPermissionHelp() {
  addMessage("Oops! I need permission to hear you. On your iPad, go to Settings > Safari > Microphone and make sure it's allowed!", 'assistant');
  speak("I need permission to hear you! Ask a grown-up to help check the microphone settings.");
}

// Initialize on load
initSpeechRecognition();

micBtn.addEventListener('click', async () => {
  // CRITICAL: Unlock audio on this user interaction (required for iOS)
  unlockAudio();

  // Stop any ongoing audio when user wants to talk
  if (isAudioPlaying || isAudioPaused) {
    stopAudio();
  }

  // Use Whisper mode for mobile
  if (useWhisper) {
    await handleWhisperRecording();
    return;
  }

  // Desktop: use Web Speech API
  if (!recognition) {
    if (!initSpeechRecognition()) {
      // Fall back to Whisper if Web Speech fails
      useWhisper = true;
      await handleWhisperRecording();
      return;
    }
  }

  if (isListening) {
    // User tapped to STOP and SEND
    wantToListen = false;
    recognition.stop();
  } else {
    // User tapped to START listening
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      wantToListen = true;
      currentTranscript = '';
      recognition.start();
    } catch (err) {
      console.error('Mic permission error:', err);
      showMicPermissionHelp();
    }
  }
});

// Handle recording with Whisper (for mobile)
async function handleWhisperRecording() {
  if (isListening) {
    // Stop recording and transcribe
    isListening = false;
    micBtn.classList.remove('listening');
    micBtn.querySelector('.mic-text').textContent = 'Processing... ⏳';
    animateMascot('thinking');

    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }
  } else {
    // Start recording
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunks = [];

      mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());

        if (audioChunks.length === 0) {
          micBtn.querySelector('.mic-text').textContent = 'Tap to Talk 🎤';
          animateMascot('idle');
          return;
        }

        // Send to Whisper for transcription
        const audioBlob = new Blob(audioChunks, { type: mediaRecorder.mimeType });
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.webm');

        try {
          const response = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData
          });

          const data = await response.json();
          micBtn.querySelector('.mic-text').textContent = 'Tap to Talk 🎤';

          if (data.text && data.text.trim()) {
            sendMessage(data.text.trim());
          } else {
            animateMascot('confused');
            addMessage("I didn't catch that. Can you try again?", 'assistant');
          }
        } catch (error) {
          console.error('Transcription error:', error);
          micBtn.querySelector('.mic-text').textContent = 'Tap to Talk 🎤';
          animateMascot('confused');
          addMessage("Oops! Couldn't hear you. Try again!", 'assistant');
        }
      };

      mediaRecorder.start();
      isListening = true;
      micBtn.classList.add('listening');
      micBtn.querySelector('.mic-text').textContent = '🔴 Tap to Send';
      animateMascot('listening');

    } catch (err) {
      console.error('Mic permission error:', err);
      showMicPermissionHelp();
    }
  }
}

sendBtn.addEventListener('click', () => {
  // Unlock audio on user interaction
  unlockAudio();

  const text = textInput.value.trim();
  if (text) {
    sendMessage(text);
    textInput.value = '';
  }
});

textInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    // Unlock audio on user interaction
    unlockAudio();

    const text = textInput.value.trim();
    if (text) {
      sendMessage(text);
      textInput.value = '';
    }
  }
});

// Handle textbook image uploads
textbookUpload.addEventListener('change', async (e) => {
  unlockAudio();
  await handleImageUpload(e.target.files, 'textbook');
  e.target.value = ''; // Reset input
});

// Handle student work image uploads
workUpload.addEventListener('change', async (e) => {
  unlockAudio();
  await handleImageUpload(e.target.files, 'work');
  e.target.value = ''; // Reset input
});

// Handle image upload for either type
async function handleImageUpload(files, type) {
  const fileArray = Array.from(files);
  if (fileArray.length === 0) return;

  for (const file of fileArray) {
    const reader = new FileReader();
    reader.onload = (ev) => {
      // Create preview with label
      const wrapper = document.createElement('div');
      wrapper.className = 'image-preview-item';
      wrapper.innerHTML = `
        <img src="${ev.target.result}" alt="${type}">
        <span class="image-label ${type}">${type === 'textbook' ? '📖' : '✏️'}</span>
        <button class="remove-image" data-type="${type}" data-index="${pendingImages[type].length}">×</button>
      `;
      imagePreview.appendChild(wrapper);

      pendingImages[type].push({
        data: ev.target.result,
        type: file.type,
        file: file
      });

      updatePendingInfo();
    };
    reader.readAsDataURL(file);
  }
}

// Update pending images info
function updatePendingInfo() {
  const textbookCount = pendingImages.textbook.length;
  const workCount = pendingImages.work.length;
  const total = textbookCount + workCount;

  if (total > 0) {
    let info = [];
    if (textbookCount > 0) info.push(`📖 ${textbookCount} question${textbookCount > 1 ? 's' : ''}`);
    if (workCount > 0) info.push(`✏️ ${workCount} work image${workCount > 1 ? 's' : ''}`);
    pendingImagesInfo.textContent = info.join(' • ');
    analyzeBtn.classList.remove('hidden');
  } else {
    pendingImagesInfo.textContent = '';
    analyzeBtn.classList.add('hidden');
  }
}

// Remove image handler
imagePreview.addEventListener('click', (e) => {
  if (e.target.classList.contains('remove-image')) {
    const type = e.target.dataset.type;
    const index = parseInt(e.target.dataset.index);
    pendingImages[type].splice(index, 1);
    e.target.parentElement.remove();
    updatePendingInfo();
    // Re-index remaining images
    reindexImages();
  }
});

function reindexImages() {
  const items = imagePreview.querySelectorAll('.image-preview-item');
  let textbookIdx = 0, workIdx = 0;
  items.forEach(item => {
    const btn = item.querySelector('.remove-image');
    const type = btn.dataset.type;
    if (type === 'textbook') {
      btn.dataset.index = textbookIdx++;
    } else {
      btn.dataset.index = workIdx++;
    }
  });
}

// Analyze button click
analyzeBtn.addEventListener('click', async () => {
  unlockAudio();
  await analyzeHomework();
});

async function analyzeHomework() {
  const textbookCount = pendingImages.textbook.length;
  const workCount = pendingImages.work.length;

  if (textbookCount === 0 && workCount === 0) {
    addMessage("Please upload some images first!", 'assistant');
    return;
  }

  let uploadMsg = '📸 Looking at ';
  if (textbookCount > 0 && workCount > 0) {
    uploadMsg += `${textbookCount} textbook question${textbookCount > 1 ? 's' : ''} and your work...`;
  } else if (textbookCount > 0) {
    uploadMsg += `${textbookCount} textbook question${textbookCount > 1 ? 's' : ''}...`;
  } else {
    uploadMsg += `your work...`;
  }

  addMessage(uploadMsg, 'user');
  showLoading();
  animateMascot('thinking');

  const formData = new FormData();

  // Add textbook images with debugging
  console.log('=== UPLOAD DEBUG ===');
  for (const img of pendingImages.textbook) {
    console.log('Textbook file:', {
      name: img.file?.name,
      type: img.file?.type,
      size: img.file?.size,
      hasFile: !!img.file
    });
    if (img.file) {
      formData.append('textbook', img.file);
    }
  }

  // Add work images with debugging
  for (const img of pendingImages.work) {
    console.log('Work file:', {
      name: img.file?.name,
      type: img.file?.type,
      size: img.file?.size,
      hasFile: !!img.file
    });
    if (img.file) {
      formData.append('work', img.file);
    }
  }

  // Add counts for server to know what's what
  formData.append('textbookCount', textbookCount.toString());
  formData.append('workCount', workCount.toString());

  try {
    console.log('Sending to /api/analyze-homework:', { textbookCount, workCount });
    console.log('FormData entries:', [...formData.entries()].map(e => [e[0], e[1] instanceof File ? `File(${e[1].name}, ${e[1].size}bytes)` : e[1]]));
    const response = await fetch('/api/analyze-homework', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    console.log('Response from server:', data);
    removeLoading();
    animateMascot('happy');

    if (data.error) {
      console.error('Server error:', data.error, data.details);
      addMessage(data.error + (data.details ? ` (${data.details})` : ''), 'assistant');
      animateMascot('confused');
    } else {
      sessionId = data.sessionId;
      addMessage(data.response, 'assistant');
      speak(data.response);
    }
  } catch (error) {
    console.error('Fetch error:', error);
    removeLoading();
    addMessage("Oops! Something went wrong. Let's try again!", 'assistant');
    animateMascot('confused');
  }

  // Clear pending images
  pendingImages = { textbook: [], work: [] };
  imagePreview.innerHTML = '';
  updatePendingInfo();
}

async function sendMessage(text) {
  addMessage(text, 'user');
  showLoading();
  animateMascot('thinking');

  const body = {
    message: text,
    sessionId: sessionId || Date.now().toString()
  };

  // Check if there are any pending images (from the new structure)
  const hasPendingImages = pendingImages.textbook.length > 0 || pendingImages.work.length > 0;
  if (hasPendingImages) {
    // Combine all images for the chat API
    body.images = [
      ...pendingImages.textbook.map(img => ({ data: img.data, type: img.type, category: 'textbook' })),
      ...pendingImages.work.map(img => ({ data: img.data, type: img.type, category: 'work' }))
    ];
    pendingImages = { textbook: [], work: [] };
    imagePreview.innerHTML = '';
    updatePendingInfo();
  }

  if (!sessionId) {
    sessionId = body.sessionId;
  }

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    removeLoading();

    if (data.error) {
      addMessage(data.error, 'assistant');
      animateMascot('confused');
    } else {
      addMessage(data.response, 'assistant');
      speak(data.response);
      animateMascot('happy');
    }
  } catch (error) {
    removeLoading();
    addMessage("Oops! Something went wrong. Let's try again!", 'assistant');
    animateMascot('confused');
  }
}

function addMessage(text, role) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${role}`;

  // Add fun emoji prefix for assistant messages
  let displayText = text;
  if (role === 'assistant' && !text.startsWith('📸') && !text.startsWith('Oops')) {
    const emojis = ['✨', '🌟', '💫', '🎯', '💡'];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    displayText = randomEmoji + ' ' + text;
  }

  // For assistant messages, preserve LaTeX delimiters for MathJax rendering
  // For user messages, escape HTML
  let htmlContent;
  if (role === 'assistant') {
    htmlContent = formatMathContent(displayText);
  } else {
    htmlContent = escapeHtml(displayText);
  }

  messageDiv.innerHTML = `<div class="message-content">${htmlContent}</div>`;
  messagesDiv.appendChild(messageDiv);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;

  // Add pop animation
  messageDiv.style.animation = 'popIn 0.3s ease-out';

  // Trigger MathJax to render math in the new message
  if (role === 'assistant' && window.MathJax) {
    MathJax.typesetPromise([messageDiv]).catch((err) => {
      console.log('MathJax rendering error:', err);
    });
  }
}

// Format content to safely render math while escaping other HTML
function formatMathContent(text) {
  // Split text by LaTeX delimiters to process separately
  // This preserves \( \) and \[ \] while escaping everything else

  // First, temporarily replace LaTeX delimiters with placeholders
  const mathPatterns = [];
  let counter = 0;

  // Replace display math \[...\]
  text = text.replace(/\\\[([\s\S]*?)\\\]/g, (match) => {
    const placeholder = `%%MATH_DISPLAY_${counter}%%`;
    mathPatterns.push({ placeholder, content: match });
    counter++;
    return placeholder;
  });

  // Replace inline math \(...\)
  text = text.replace(/\\\(([\s\S]*?)\\\)/g, (match) => {
    const placeholder = `%%MATH_INLINE_${counter}%%`;
    mathPatterns.push({ placeholder, content: match });
    counter++;
    return placeholder;
  });

  // Now escape the remaining HTML
  text = escapeHtml(text);

  // Restore the math expressions
  for (const { placeholder, content } of mathPatterns) {
    text = text.replace(placeholder, content);
  }

  // Convert newlines to <br> for better formatting
  text = text.replace(/\n/g, '<br>');

  return text;
}

function showLoading() {
  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'message assistant loading';
  loadingDiv.id = 'loading';
  loadingDiv.innerHTML = `
    <div class="message-content">
      <span class="dot"></span>
      <span class="dot"></span>
      <span class="dot"></span>
    </div>
  `;
  messagesDiv.appendChild(loadingDiv);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function removeLoading() {
  const loading = document.getElementById('loading');
  if (loading) loading.remove();
}

let currentAudio = null;
let currentAudioUrl = null;
let isAudioPlaying = false;
let isAudioPaused = false;
let hasAudioToPlay = false;

function showAudioControl(state) {
  // state: 'playing', 'paused', 'ready' (has audio but not started)
  audioControlRow.style.display = 'block';
  hasAudioToPlay = true;

  if (state === 'playing') {
    audioBtn.classList.remove('paused', 'ready');
    audioBtn.classList.add('playing');
    audioBtn.querySelector('.audio-icon').textContent = '⏸️';
    audioBtn.querySelector('.audio-text').textContent = 'Tap to Pause';
  } else if (state === 'paused') {
    audioBtn.classList.remove('playing', 'ready');
    audioBtn.classList.add('paused');
    audioBtn.querySelector('.audio-icon').textContent = '▶️';
    audioBtn.querySelector('.audio-text').textContent = 'Tap to Resume';
  } else if (state === 'ready') {
    audioBtn.classList.remove('playing', 'paused');
    audioBtn.classList.add('ready');
    audioBtn.querySelector('.audio-icon').textContent = '🔊';
    audioBtn.querySelector('.audio-text').textContent = 'Tap to Play';
  }
}

function hideAudioControl() {
  audioControlRow.style.display = 'none';
  hasAudioToPlay = false;
  currentAudioUrl = null;
}

function pauseAudio() {
  if (currentAudio && !currentAudio.paused) {
    currentAudio.pause();
    isAudioPlaying = false;
    isAudioPaused = true;
    showAudioControl('paused');
    animateMascot('idle');
  }
  if (synthesis.speaking && !synthesis.paused) {
    synthesis.pause();
    isAudioPlaying = false;
    isAudioPaused = true;
    showAudioControl('paused');
    animateMascot('idle');
  }
}

function resumeAudio() {
  if (currentAudio && currentAudio.paused) {
    currentAudio.play();
    isAudioPlaying = true;
    isAudioPaused = false;
    showAudioControl('playing');
    animateMascot('talking');
    return true;
  }
  if (synthesis.paused) {
    synthesis.resume();
    isAudioPlaying = true;
    isAudioPaused = false;
    showAudioControl('playing');
    animateMascot('talking');
    return true;
  }
  return false;
}

function playAudioFromReady() {
  if (currentAudio && currentAudioUrl) {
    currentAudio.play().then(() => {
      isAudioPlaying = true;
      isAudioPaused = false;
      showAudioControl('playing');
      animateMascot('talking');
    }).catch(e => {
      console.log('Play failed:', e);
    });
  }
}

function stopAudio() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    // Don't null out warmAudio - we reuse it on iOS
    if (currentAudio !== warmAudio) {
      currentAudio = null;
    }
  }
  if (warmAudio) {
    warmAudio.pause();
    warmAudio.currentTime = 0;
  }
  synthesis.cancel();
  isAudioPlaying = false;
  isAudioPaused = false;
  hideAudioControl();
}

function updateMicButton() {
  if (isListening) {
    micBtn.classList.add('listening');
    micBtn.querySelector('.mic-text').textContent = '🔴 Tap to Send';
  } else {
    micBtn.classList.remove('listening');
    micBtn.querySelector('.mic-text').textContent = 'Tap to Talk';
  }
}

// Audio control button - separate from mic
audioBtn.addEventListener('click', () => {
  // Unlock audio on this interaction too
  unlockAudio();

  if (isAudioPlaying) {
    pauseAudio();
  } else if (isAudioPaused || hasAudioToPlay) {
    // Either resume paused audio or play from ready state
    if (currentAudio) {
      currentAudio.play().then(() => {
        isAudioPlaying = true;
        isAudioPaused = false;
        showAudioControl('playing');
        animateMascot('talking');
      }).catch(e => {
        console.log('Play failed:', e);
      });
    }
  }
});

async function speak(text) {
  // Skip voice if disabled
  if (!voiceEnabled) {
    return;
  }

  stopAudio();
  animateMascot('talking');

  // Try OpenAI TTS first if available
  if (useOpenAITTS) {
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        const audioBlob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(audioBlob);

        // Set up audio element
        if (isIOS && warmAudio) {
          currentAudio = warmAudio;
          currentAudio.src = audioUrl;
        } else {
          currentAudio = new Audio(audioUrl);
          currentAudio.playsInline = true;
        }

        currentAudioUrl = audioUrl;

        currentAudio.onended = () => {
          isAudioPlaying = false;
          isAudioPaused = false;
          animateMascot('idle');
          hideAudioControl();
          URL.revokeObjectURL(audioUrl);
          if (currentAudio !== warmAudio) {
            currentAudio = null;
          }
        };

        // Try to autoplay
        try {
          await currentAudio.play();
          isAudioPlaying = true;
          isAudioPaused = false;
          showAudioControl('playing');
        } catch (playError) {
          // Autoplay blocked - show button to play manually
          console.log('Autoplay blocked:', playError);
          isAudioPlaying = false;
          isAudioPaused = false;
          showAudioControl('ready');
          animateMascot('idle');
        }
        return;
      }
    } catch (e) {
      console.log('OpenAI TTS error:', e);
    }
  }

  // Fallback to browser TTS
  speakWithBrowser(text);
}

function addPlayButton(audioUrl) {
  const playBtn = document.createElement('button');
  playBtn.className = 'play-btn';
  playBtn.innerHTML = '🔊 Tap to hear response';
  playBtn.onclick = async () => {
    playBtn.remove();
    currentAudio = new Audio(audioUrl);
    currentAudio.onended = () => {
      animateMascot('idle');
      URL.revokeObjectURL(audioUrl);
      currentAudio = null;
    };
    await currentAudio.play();
    animateMascot('talking');
  };
  messagesDiv.appendChild(playBtn);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
  animateMascot('idle');
}

function speakWithBrowser(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95;
  utterance.pitch = 1.15;
  utterance.volume = 1;

  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }

  utterance.onstart = () => {
    isAudioPlaying = true;
    showAudioControl('playing');
    animateMascot('talking');
  };

  utterance.onend = () => {
    isAudioPlaying = false;
    isAudioPaused = false;
    hideAudioControl();
    animateMascot('idle');
  };

  synthesis.speak(utterance);
}

function animateMascot(state) {
  if (!mascot) return;

  mascot.className = 'mascot';

  switch(state) {
    case 'listening':
      mascot.textContent = '🦉';
      mascot.classList.add('bounce');
      break;
    case 'thinking':
      mascot.textContent = '🤔';
      mascot.classList.add('wiggle');
      break;
    case 'talking':
      mascot.textContent = '🦉';
      mascot.classList.add('pulse');
      break;
    case 'happy':
      mascot.textContent = '🎉';
      mascot.classList.add('bounce');
      setTimeout(() => {
        mascot.textContent = '🦉';
        mascot.className = 'mascot';
      }, 2000);
      break;
    case 'confused':
      mascot.textContent = '🤷';
      setTimeout(() => {
        mascot.textContent = '🦉';
        mascot.className = 'mascot';
      }, 2000);
      break;
    default:
      mascot.textContent = '🦉';
  }
}

newSessionBtn.addEventListener('click', async () => {
  if (sessionId) {
    await fetch('/api/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId })
    });
  }

  sessionId = null;
  pendingImages = { textbook: [], work: [] };
  imagePreview.innerHTML = '';
  updatePendingInfo();
  messagesDiv.innerHTML = `
    <div class="message assistant">
      <div class="message-content">
        ✨ Ready for a new adventure! Take a photo of your homework and let's solve it together!
      </div>
    </div>
  `;
  synthesis.cancel();
  animateMascot('happy');
});

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Add confetti effect for celebrations
function celebrate() {
  const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dfe6e9'];
  for (let i = 0; i < 50; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.left = Math.random() * 100 + 'vw';
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.animationDelay = Math.random() * 2 + 's';
    document.body.appendChild(confetti);
    setTimeout(() => confetti.remove(), 3000);
  }
}
