// ===================================
// INES CHATBOT - VANILLA JAVASCRIPT
// ===================================
import { GoogleGenAI } from "@google/genai";


const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenAI({apiKey: GEMINI_API_KEY});




async function translateToEnglish(text, sourceLanguage = "auto") {
  if (!text.trim() || sourceLanguage === 'en') return text;

  try {
    const prompt = `
You are a professional multilingual translator AI.
Translate the following text from ${sourceLanguage} to English **accurately and literally**.
Keep punctuation, formatting, numbers, and structure identical.
Do NOT add explanations, notes, or summaries.

Text:
"""${text}"""
`;

    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    // Handle Gemini responses safely across SDK versions
    const translatedText = response.text ?? response.response?.text();

    // Trim and ensure it returns valid English
    return translatedText;
  } catch (error) {
    console.error("Error translating to English:", error);
    return text; // fallback
  }
}





async function translateFromEnglish(text, targetLanguage) {
  return text
  if (!text.trim() || targetLanguage === 'en') return text;
  try {
  const response = await genAI.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{
      role: "user",
      parts: [{
        text:`
You are a professional translator AI. Translate the given text exactly from English to ${targetLanguage}. The translated text should be in markdown format. Keep formatting, punctuation, and numbers identical. Do not explain or summarize.

Text to translate:
"""${text}"""
`
      }]
    }]
  });

    const translatedText = response.text ?? response.response?.text();
    return translatedText;
  } catch (error) {
    console.error("Error translating from English:", error);
    return text; // Fallback to original text
  }
}



// Translations
const translations = {
    en: {
        'chatbot-title': 'Ines Assistant',
        'online': 'Online',
        'welcome-title': 'Welcome to Ines University!',
        'welcome-text': "I'm your virtual assistant. How can I help you today?",
        'input-placeholder': 'Type your message here...'
    },
    fr: {
        'chatbot-title': 'Assistant Ines',
        'online': 'En ligne',
        'welcome-title': "Bienvenue à l'Université Ines!",
        'welcome-text': 'Je suis votre assistant virtuel. Comment puis-je vous aider aujourd\'hui?',
        'input-placeholder': 'Tapez votre message ici...'
    },
    rw: {
        'chatbot-title': 'Umufasha wa Ines',
        'online': 'Kuri interineti',
        'welcome-title': 'Murakaza neza kuri Kaminuza ya Ines!',
        'welcome-text': 'Ndi umufasha wawe wa elegitoronike. Nakugirira iki uyu munsi?',
        'input-placeholder': 'Andika ubutumwa bwawe hano...'
    },
    ar: {
        'chatbot-title': 'مساعد إينيس',
        'online': 'متصل',
        'welcome-title': 'مرحبًا بك في جامعة إينيس!',
        'welcome-text': 'أنا مساعدك الافتراضي. كيف يمكنني مساعدتك اليوم؟',
        'input-placeholder': 'اكتب رسالتك هنا...'
    }
};

// Current language
let currentLanguage = 'en';

// DOM Elements
const languageBtn = document.getElementById('languageBtn');
const languageDropdown = document.getElementById('languageDropdown');
const currentLangSpan = document.getElementById('currentLang');
const languageOptions = document.querySelectorAll('.language-option');
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');
const chatMessages = document.getElementById('chatMessages');
const typingIndicator = document.getElementById('typingIndicator');
const quickActionBtns = document.querySelectorAll('.quick-action-btn');
const micBtn = document.getElementById('micBtn');

// Voice recognition
let recognition = null;
let isRecording = false;

// ===================================
// LANGUAGE SWITCHING
// ===================================

// Toggle language dropdown
languageBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    languageBtn.classList.toggle('active');
    languageDropdown.classList.toggle('active');
});

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    if (!languageBtn.contains(e.target) && !languageDropdown.contains(e.target)) {
        languageBtn.classList.remove('active');
        languageDropdown.classList.remove('active');
    }
});

// Language selection
languageOptions.forEach(option => {
    option.addEventListener('click', () => {
        const lang = option.getAttribute('data-lang');
        const dir = option.getAttribute('data-dir');
        
        // Update current language
        currentLanguage = lang;
        
        // Update language button text
        const langCodes = { en: 'EN', fr: 'FR', rw: 'RW', ar: 'AR' };
        currentLangSpan.textContent = langCodes[lang];
        
        // Update document direction
        document.documentElement.setAttribute('lang', lang);
        document.documentElement.setAttribute('dir', dir);
        
        // Update selected state
        languageOptions.forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
        
        // Close dropdown
        languageBtn.classList.remove('active');
        languageDropdown.classList.remove('active');
        
        // Update all translations
        updateTranslations();
    });
});

// Update translations
function updateTranslations() {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translations[currentLanguage] && translations[currentLanguage][key]) {
            element.textContent = translations[currentLanguage][key];
        }
    });
    
    // Update placeholder
    const placeholderKey = chatInput.getAttribute('data-i18n-placeholder');
    if (placeholderKey && translations[currentLanguage] && translations[currentLanguage][placeholderKey]) {
        chatInput.placeholder = translations[currentLanguage][placeholderKey];
    }
}

// ===================================
// TEXT-TO-SPEECH
// ===================================

let currentSpeech = null;

// Add click event to all TTS buttons
document.addEventListener('click', (e) => {
    if (e.target.closest('.tts-button')) {
        const button = e.target.closest('.tts-button');
        const messageContent = button.closest('.message-content');
        const text = messageContent.querySelector('.message-text').textContent;
        
        toggleSpeech(button, text);
    }
});

function toggleSpeech(button, text) {
    // Check if speech synthesis is supported
    if (!('speechSynthesis' in window)) {
        alert('Sorry, your browser does not support text-to-speech.');
        return;
    }
    
    // If already speaking, stop
    if (currentSpeech && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        document.querySelectorAll('.tts-button').forEach(btn => {
            btn.classList.remove('playing');
        });
        currentSpeech = null;
        return;
    }
    
    // Create new speech
    currentSpeech = new SpeechSynthesisUtterance(text);
    
    // Set language based on current selection
    const langCodes = {
        en: 'en-US',
        fr: 'fr-FR',
        rw: 'en-US', // Fallback to English for Kinyarwanda
        ar: 'ar-SA'
    };
    currentSpeech.lang = langCodes[currentLanguage] || 'en-US';
    
    // Set voice properties
    currentSpeech.rate = 0.9;
    currentSpeech.pitch = 1;
    currentSpeech.volume = 1;
    
    // Add event listeners
    currentSpeech.onstart = () => {
        button.classList.add('playing');
    };
    
    currentSpeech.onend = () => {
        button.classList.remove('playing');
        currentSpeech = null;
    };
    
    currentSpeech.onerror = () => {
        button.classList.remove('playing');
        currentSpeech = null;
    };
    
    // Speak
    window.speechSynthesis.speak(currentSpeech);
}

// ===================================
// CHAT FUNCTIONALITY
// ===================================

// Handle form submission - moved to file upload section below

// Add user message
function addUserMessage(text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message user-message';
    messageDiv.innerHTML = `
        <div class="message-content">
            <p>${escapeHtml(text)}</p>
        </div>
        <div class="message-avatar user-avatar">
            <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
        </div>
    `;
    
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
}

function markdownToHtml(text) {
    const lines = text.split('\n');
    let html = '';
    let inList = false;

    for (const line of lines) {
        // Bold
        let processedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        if (/^\s*\*\s/.test(processedLine)) {
            if (!inList) {
                html += '<ul>';
                inList = true;
            }
            html += `<li>${processedLine.replace(/^\s*\*\s/, '')}</li>`;
        } else {
            if (inList) {
                html += '</ul>';
                inList = false;
            }
            if (processedLine.trim() !== '') {
                html += `<p>${processedLine}</p>`;
            }
        }
    }

    if (inList) {
        html += '</ul>';
    }

    return html;
}

// Add bot message
function addBotMessage(text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot-message';
    const htmlContent = markdownToHtml(text);

    messageDiv.innerHTML = `
        <div class="message-avatar bot-avatar">
            <img src="image.jpg" alt="Bot Avatar">
        </div>
        <div class="message-content">
            <div class="message-text">${htmlContent}</div>
            <button class="tts-button" aria-label="Read aloud" title="Listen to this message">
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                </svg>
            </button>
        </div>
    `;
    
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
}

// Show typing indicator
function showTypingIndicator() {
    typingIndicator.style.display = 'flex';
    scrollToBottom();
}

// Hide typing indicator
function hideTypingIndicator() {
    typingIndicator.style.display = 'none';
}

// Scroll to bottom
function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}





// ===================================
// VOICE RECOGNITION
// ===================================

// Initialize speech recognition
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    
    // Set language based on current selection
    const langCodes = {
        en: 'en-US',
        fr: 'fr-FR',
        rw: 'rw-RW',
        ar: 'ar-SA'
    };
    
    recognition.lang = langCodes[currentLanguage] || 'en-US';
    
    // Handle recognition results
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        chatInput.value = transcript;
        chatInput.focus();
    };
    
    // Handle recognition end
    recognition.onend = () => {
        isRecording = false;
        micBtn.classList.remove('recording');
    };
    
    // Handle recognition error
    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        isRecording = false;
        micBtn.classList.remove('recording');
        
        if (event.error === 'no-speech') {
            alert('No speech detected. Please try again.');
        } else if (event.error === 'not-allowed') {
            alert('Microphone access denied. Please allow microphone access in your browser settings.');
        }
    };
}

// Microphone button click handler
if (micBtn) {
    micBtn.addEventListener('click', () => {
        if (!recognition) {
            alert('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
            return;
        }
        
        if (isRecording) {
            // Stop recording
            recognition.stop();
            isRecording = false;
            micBtn.classList.remove('recording');
        } else {
            // Start recording
            // Update language before starting
            const langCodes = {
                en: 'en-US',
                fr: 'fr-FR',
                rw: 'rw-RW',
                ar: 'ar-SA'
            };
            recognition.lang = langCodes[currentLanguage] || 'en-US';
            
            try {
                recognition.start();
                isRecording = true;
                micBtn.classList.add('recording');
            } catch (error) {
                console.error('Error starting recognition:', error);
            }
        }
    });
}




const LANGUAGES_MAP = {
    en: 'English',
    fr: 'French',
    rw: 'Kinyarwanda',
    ar: 'Arabic'
}

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const message = chatInput.value.trim();
    
    // Normal message handling
    if (!message) return;
    
    addUserMessage(message);
    chatInput.value = '';
    
    showTypingIndicator();

    try {
        // Translate user query to English
        const translatedQuery = await translateToEnglish(message, currentLanguage);
        console.log('user_language:', LANGUAGES_MAP[currentLanguage]);

    

        const response = await fetch("http://127.0.0.1:5000/ines_bot", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                query: translatedQuery,
                user_language: LANGUAGES_MAP[currentLanguage],
            })
        });

        if (!response.ok) {
            throw new Error("Network response was not ok");
        }

        const data = await response.json();

        // Translate bot response from English
        const translatedResponse = await translateFromEnglish(data.answer, currentLanguage);

        hideTypingIndicator();
        addBotMessage(translatedResponse);
    } catch (error) {
        console.error("Error:", error);
        hideTypingIndicator();
        addBotMessage("Sorry, something went wrong. Please try again.");
    }
});



// ===================================
// INITIALIZATION
// ===================================

// Set initial language
document.querySelector('.language-option[data-lang="en"]').classList.add('selected');

// Focus input on load
chatInput.focus();

// Auto-scroll to bottom on load
scrollToBottom();

console.log('Ines Chatbot initialized successfully!');
