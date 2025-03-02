const OPENAI_API_KEY = "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"; // ⚠️ Directly using API key (not secure)

// Memory storage for reminders erg
let memory = [];
let isRecording = false; // Tracks speech recognition state

// Speech Recognition (Web Speech API)
let recognition;
if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
    recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.continuous = false; // Stops after one sentence
    recognition.interimResults = false; // Only final results
    recognition.lang = "en-US";

    recognition.onresult = function (event) {
        let transcript = event.results[0][0].transcript.trim();
        document.getElementById("userInput").value = transcript;
        sendMessage(); // Auto-send recognized speech
    };

    recognition.onerror = function (event) {
        console.error("❌ Speech recognition error:", event.error);
    };

} else {
    alert("❌ Speech recognition is not supported in this browser.");
}

// Fetch ChatGPT Response
async function fetchChatGPTResponse(userInput) {
    try {
        let botResponse;

        // Memory Assistance (Detect Commands)
        if (userInput.startsWith("remind me")) {
            let reminder = userInput.replace("remind me", "").trim();
            memory.push(reminder);
            botResponse = `Got it! I'll remind you: "${reminder}".`;
        } else if (userInput.includes("what reminders do I have")) {
            botResponse = memory.length ? `Your reminders: ${memory.join(", ")}` : "You don't have any saved reminders.";
        }

        // Exercise Guidance
        else if (userInput.includes("exercise") || userInput.includes("mobility")) {
            botResponse = "Here are some exercises that may help:\n" +
                "- **Big Step Walking**: Take exaggerated steps to improve gait.\n" +
                "- **Voice Exercises**: Speak loudly and clearly to strengthen speech.\n" +
                "- **Balance Training**: Stand on one foot for a few seconds.\n" +
                "Would you like guidance on any of these?";
        }

        // Default ChatGPT Response
        else {
            const response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                    model: "gpt-3.5-turbo",
                    messages: [
                        { role: "system", content: "You are an empathetic assistant designed to support individuals with Parkinson’s disease. Provide memory reminders, mobility exercises, and patient encouragement." },
                        { role: "user", content: userInput }
                    ],
                    max_tokens: 100
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            botResponse = data.choices[0].message.content;
        }

        return botResponse;

    } catch (error) {
        console.error("❌ ChatGPT API Error:", error);
        return "I'm sorry, I couldn't connect to the AI. Please try again.";
    }
}

// Send Message
async function sendMessage() {
    const userInputField = document.getElementById("userInput");
    const userInput = userInputField.value.trim();

    if (!userInput) {
        console.log("⚠️ No input detected.");
        return;
    }

    console.log(`📤 Sending: "${userInput}"`);
    displayMessage("You: " + userInput, "user");

    let botResponse = "Thinking...";
    displayMessage("Bot: " + botResponse, "bot");

    try {
        botResponse = await fetchChatGPTResponse(userInput);
        console.log(`🤖 Response: "${botResponse}"`);
    } catch (error) {
        botResponse = "I couldn't process your request.";
        console.error("❌ Error fetching response:", error);
    }

    displayMessage("Bot: " + botResponse, "bot");
    speak(botResponse);
    userInputField.value = "";
}

// Display Chat Messages
function displayMessage(message, sender) {
    const chatbox = document.getElementById("chatbox");
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${sender}`;
    messageDiv.textContent = message;
    chatbox.appendChild(messageDiv);
    chatbox.scrollTop = chatbox.scrollHeight;
}

// Text-to-Speech with Slower Output
function speak(text) {
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = "en-US";
    speech.rate = 0.8; // Slower speech for accessibility
    window.speechSynthesis.speak(speech);
}

// Start/Stop Voice Recording
function toggleRecording() {
    if (!recognition) {
        alert("Speech recognition is not supported in this browser.");
        return;
    }

    if (isRecording) {
        recognition.stop();
        isRecording = false;
        console.log("🎙️ Stopped recording.");
    } else {
        recognition.start();
        isRecording = true;
        console.log("🎤 Listening...");
    }
}

// Enable "Enter" Key to Send Messages
document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("userInput").addEventListener("keypress", function (event) {
        if (event.key === "Enter") {
            event.preventDefault();
            sendMessage();
        }
    });

    // Ensure buttons are connected to functions
    document.getElementById("sendButton").addEventListener("click", sendMessage);
    document.getElementById("recordButton").addEventListener("click", toggleRecording);
});
