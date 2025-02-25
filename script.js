/* script.js */

function sendMessage() {
    let userInput = document.getElementById("user-input").value;
    let chatBox = document.getElementById("chat-box");
    
    if (userInput.trim() === "") return;
    
    let userMessage = document.createElement("p");
    userMessage.textContent = "Вы: " + userInput;
    userMessage.style.color = "#333";
    chatBox.appendChild(userMessage);
    
    document.getElementById("user-input").value = "";
    
    setTimeout(() => {
        let botMessage = document.createElement("p");
        botMessage.textContent = "Рядом: Спасибо за ваше сообщение. Мы рядом!";
        botMessage.style.color = "green";
        chatBox.appendChild(botMessage);
        chatBox.scrollTop = chatBox.scrollHeight;
    }, 1000);
}
