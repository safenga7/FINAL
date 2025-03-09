document.addEventListener("DOMContentLoaded", function () {
    const chatBox = document.querySelector(".chat-box");
    const inputField = document.querySelector(".message-input");
    const sendButton = document.querySelector(".send-button");

    if (!chatBox || !inputField || !sendButton) {
        console.error("❌ خطأ: لم يتم العثور على أحد العناصر في DOM!");
        return;
    }

    const responses = {
        "я грустный": "Мне жаль это слышать. Попробуйте поделиться своими чувствами с кем-то близким. Я здесь, чтобы поддержать вас. 💙",
        "мне одиноко": "Одиночество бывает тяжёлым. Может быть, попробуете найти новое хобби или поговорите с другом? Я рядом! 🤗",
        "у меня проблемы с деньгами": "Финансовые трудности могут быть стрессовыми. Может, стоит составить план или поговорить с кем-то, кто может помочь? 💰",
        "я тревожусь": "Тревога - это нормально, особенно в сложных ситуациях. Глубокое дыхание и медитация могут помочь. Попробуйте! 🧘‍♂️",
        "я устал": "Отдых очень важен. Дайте себе время расслабиться и восстановить силы. 😴",
        "меня никто не понимает": "Иногда кажется, что никто не понимает нас, но это не так. Возможно, стоит поговорить с тем, кому вы доверяете? 💞",
        "я не знаю, что делать": "Сделайте шаг назад и попробуйте подумать, какие есть варианты. Возможно, поможет совет друга. 🌟",
        "я в стрессе": "Попробуйте отвлечься на что-то приятное: музыку, прогулку или книгу. Это поможет снизить уровень стресса. 🎶📖",
        "у меня нет мотивации": "Попробуйте вспомнить, зачем вы начали. Маленькие шаги приведут вас к большой цели. 🚀",
        "мне плохо": "Простите, что вы так себя чувствуете. Может быть, стоит поговорить с кем-то, кто может помочь? Я здесь для вас. 🤝"
    };

    function addMessage(text, sender) {
        const messageDiv = document.createElement("div");
        messageDiv.classList.add("message", sender);

        if (sender === "bot") {
            const botImage = document.createElement("img");
            botImage.src = "images/hope.svg";
            botImage.alt = "Bot";
            messageDiv.appendChild(botImage);
        }

        const messageText = document.createElement("p");
        messageText.textContent = text;
        messageDiv.appendChild(messageText);
        chatBox.appendChild(messageDiv);

        chatBox.scrollTop = chatBox.scrollHeight;
    }

    function sendMessage() {
        const userMessage = inputField.value.trim().toLowerCase();
        if (userMessage === "") return;

        addMessage(userMessage, "user");
        inputField.value = "";

        setTimeout(() => {
            const matchedKey = Object.keys(responses).find(question => userMessage.includes(question));
            const botResponse = matchedKey ? responses[matchedKey] : "Я здесь, чтобы поддержать вас. Расскажите мне больше. 💙";
            addMessage(botResponse, "bot");
        }, 500);
    }

    sendButton.addEventListener("click", sendMessage);
    inputField.addEventListener("keypress", function (event) {
        if (event.key === "Enter") {
            sendMessage();
        }
    });
});
function filterContent() {
    let input = document.getElementById("searchInput").value.toLowerCase();
    let items = document.querySelectorAll(".library-item");

    items.forEach(item => {
        let text = item.innerText.toLowerCase();
        item.style.display = text.includes(input) ? "block" : "none";
    });
}

function filterCategory(category) {
    let items = document.querySelectorAll(".library-item");
    let buttons = document.querySelectorAll(".category-btn");

    buttons.forEach(btn => btn.classList.remove("active"));
    event.target.classList.add("active");

    items.forEach(item => {
        if (category === "all" || item.classList.contains(category)) {
            item.style.display = "block";
        } else {
            item.style.display = "none";
        }
    });
}