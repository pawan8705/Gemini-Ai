let typingForm = document.querySelector(".typing-form");
let chatList = document.querySelector(".chat-list");
let suggestions = document.querySelectorAll(".suggestion-list .suggestion");
let toggleThemeButton = document.querySelector("#toggle-Theme-button");
let deleteChatButton = document.querySelector("#delete-chat-button");

let userMessage = null;
let isResponsGenerating = false;

let loadLocalstorage = () => {
  let savedChats = localStorage.getItem("savedChats");
  let isLightMode = (localStorage.getItem("themeColor") === "light_mode");

  //Set the theme based on the value in local storage
  document.body.classList.toggle("light_mode", isLightMode);
  toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";

  //Load saved chats from local storage
  chatList.innerHTML = savedChats || "";
  document.body.classList.toggle("hide-header", savedChats);
  chatList.scrollTo(0, chatList.scrollHeight); //Scroll to the bottom of the chat list
}

loadLocalstorage();

//API configuration
let GEMINI_API_KEY = "AIzaSyDE6LP_HZMRSL5lOYujZ9I8w9ijBZDQGHU";
let API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

//Create a new message element and return it
let createMessageElement = (content, ...classes) => {
  let div = document.createElement("div");
  div.classList.add("message", ...classes);
  div.innerHTML = content;
  return div;
}

//Show typing effect by displaying words one by one
let showTypingEffect = (text, textElement, incomingMessageDiv) => {
  let words = text.split(' ');
  let currentWordIndex = 0;

  let typingInterval = setInterval(() => {

    // Append each word to the text element with a space
    textElement.innerText += (currentWordIndex === 0 ? ' ' : ' ') + words[currentWordIndex++];
    incomingMessageDiv.querySelector(".icon").classList.add("hide"); //Hide copy icon

    //If all words are displayed
    if (currentWordIndex === words.length) {
      clearInterval(typingInterval);
      isResponsGenerating = false;
      incomingMessageDiv.querySelector(".icon").classList.remove("hide"); //Show copy icon
      localStorage.setItem("savedChats", chatList.innerHTML); //Save chat to local storage
    }
    chatList.scrollTo(0, chatList.scrollHeight); //Scroll to the bottom of the chat list
  }, 75);
}

// Fetch response from the API based on user message
let generateAPIResponse = async (incomingMessageDiv) => {
  let textElement = incomingMessageDiv.querySelector(".text"); //Get text element

  //Send a POST request to the API with the user's message
  try {
    let response = await fetch(API_URL, {
      method: "Post",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          role: "user",
          parts: [{ text: userMessage }]
        }]
      })
    });

    let data = await response.json();
    if (!response.ok) throw new Error(data.error.message);
    //Get the API response Text and remove the bold markdown
    let apiResponse = data?.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g, '$1');
    showTypingEffect(apiResponse, textElement, incomingMessageDiv);
  }
  catch (error) {
    isResponsGenerating = false;
    textElement.innerText = error.message;
    textElement.classList.add("error");
  }
  finally {
    incomingMessageDiv.classList.remove("loading");
  }
}

//Show a loading animation while waiting for the API response
let showLoadingAnimation = () => {
  let html = `<div class="message-content">
                <img src="/Gemini Ai/Assets/gemini.svg" alt="Gemini Image" class="avatar">
                <p class="text"></p>
                <div class="loading-indicator">
                    <div class="loading-bar"></div>
                    <div class="loading-bar"></div>
                    <div class="loading-bar"></div>
                </div>
            </div>
            <span onclick="copyMessage(this)" class=" icon material-symbols-rounded">
                content_copy
            </span>`;

  let incomingMessageDiv = createMessageElement(html, "incoming", "loading");
  chatList.appendChild(incomingMessageDiv);
  chatList.scrollTo(0, chatList.scrollHeight); //Scroll to the bottom of the chat list
  generateAPIResponse(incomingMessageDiv);
}

//Copy message text to the clipboard
let copyMessage = (copyIcon) => {
  let messageText = copyIcon.parentElement.querySelector(".text").innerText;
  navigator.clipboard.writeText(messageText);
  copyIcon.innerText = "done"; // Show tick icon
  setTimeout(() => copyIcon.innerText = "content_copy", 1000); // Revert icon after 1 second

}

//Handle sending outgoing chat messages
let handleOutgoingChat = () => {
  userMessage = typingForm.querySelector(".typing-input").value.trim() || userMessage;
  if (!userMessage || isResponsGenerating) return; //Exit if there is no message
  isResponsGenerating = true;
  let html = `<div class="message-content">
                <img src="/Gemini Ai/Assets/user.jpg" alt="User Image" class="avatar">
                <p class="text"></p>
            </div>`;
  let outgoingMessageDiv = createMessageElement(html, "outgoing");
  outgoingMessageDiv.querySelector(".text").innerText = userMessage;
  chatList.appendChild(outgoingMessageDiv);
  typingForm.reset(); //Clear input field
  chatList.scrollTo(0, chatList.scrollHeight); //Scroll to the bottom of the chat list
  document.body.classList.add("hide-header"); //Hide the header once chat start
  setTimeout(showLoadingAnimation, 500);
  //Show loading animation after a delay
}

// Set userMessage and handle outgoing chat when a suggestion is clicked
suggestions.forEach(suggestion => {
  suggestion.addEventListener("click", () => {
    userMessage = suggestion.querySelector(".text").innerText;
    handleOutgoingChat();
  });
});

//Toggle between light and dark theme mode
toggleThemeButton.addEventListener("click", () => {
  let isLightMode = document.body.classList.toggle("light_mode");
  localStorage.setItem("themeColor", isLightMode ? "light_mode" : "dark_mode")
  toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";
});

//Delete all chats from local storage when button is clicked
deleteChatButton.addEventListener("click", () => {
  if (confirm("Are you sure you want to delete all messages ?")) {
    localStorage.removeItem("savedChats");
    loadLocalstorage();
  }
});

// prevent Default form submission and handle outgoing chat
typingForm.addEventListener("submit", (e) => {
  e.preventDefault();
  handleOutgoingChat();
});