document.addEventListener("DOMContentLoaded", function () {
    const chatBox = document.querySelector(".chat-box");
    const inputField = document.querySelector(".chat-input input");
    const sendButton = document.querySelector(".chat-input button");

    function addMessage(text, sender) {
        const messageDiv = document.createElement("div");
        messageDiv.classList.add("message", sender);

        const messageText = document.createElement("p");
        messageText.textContent = text;

        messageDiv.appendChild(messageText);
        chatBox.appendChild(messageDiv);

        // التمرير لأسفل تلقائيًا عند إرسال رسالة جديدة
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    function sendMessage() {
        const userMessage = inputField.value.trim();
        if (userMessage === "") return;

        // إزالة الرسائل الافتراضية عند الإرسال الأول
        document.querySelectorAll(".message").forEach(msg => msg.remove());

        addMessage(userMessage, "user");
        inputField.value = "";

        // رد تلقائي من الروبوت بعد نصف ثانية
        setTimeout(() => {
            addMessage("Я здесь, чтобы быть с вами. Я рядом. Скажите мне, как вы себя чувствуете?", "bot");
        }, 500);
    }

    // حدث النقر على زر الإرسال
    sendButton.addEventListener("click", sendMessage);

    // حدث الضغط على Enter
    inputField.addEventListener("keypress", function (event) {
        if (event.key === "Enter") {
            sendMessage();
        }
    });
});