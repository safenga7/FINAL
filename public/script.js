document.addEventListener("DOMContentLoaded", function () {
    // ✅ ChatBot Code
    const chatBox = document.querySelector(".chat-box");
    const inputField = document.querySelector(".message-input");
    const sendButton = document.querySelector(".send-button");

    if (chatBox && inputField && sendButton) {
        // ذاكرة المحادثة
        const memory = {
            lastMessages: [],
            detectLanguage: function(text) {
                if (/[\u0600-\u06FF]/.test(text)) return 'ar';
                if (/[а-яА-ЯЁё]/.test(text)) return 'ru';
                return 'en';
            }
        };

        // ردود منفصلة لكل لغة
        const responses = {
            ar: {
                greetings: ["مرحباً! كيف يمكنني مساعدتك؟", "أهلاً بك، أنا هنا لمساعدتك."],
                presence: ["نعم، أنا هنا", "أنا أستمع لك"],
                repeat: ["لقد سمعتك أول مرة، هل تريد أن أشرح أكثر؟", "نعم ما زلت هنا..."],
                emotions: {
                    "حزين": "أنا آسف لسماع ذلك. تريد التحدث عما يزعجك؟",
                    "وحيد": "الوحدة قد تكون صعبة، لكن تذكر أنك لست وحدك.",
                    "مشاكل مالية": "حاول تقسيم المشكلة إلى خطوات أصغر قد يساعد في حلها.",
                    "قلق": "خذ نفساً عميقاً، الأمور ستتحسن مع الوقت.",
                    "متعب": "الراحة مهمة جداً لصحتك، لا تهملها.",
                    "محدش فاهميني": "أنا هنا لأفهمك، يمكنك التحدث بحرية.",
                    "مش عارف أعمل إيه": "حاول أخذ وقتك في التفكير، القرارات الجيدة تحتاج صبراً.",
                    "متوتر": "جرب تمارين التنفس أو الاستماع لموسيقى هادئة.",
                    "مفيش دافع": "ابدأ بشيء صغير، الخطوات الصغيرة تقود إلى نتائج كبيرة.",
                    "مزاجي وحش": "اعترافك بهذا يعد بداية جيدة للتغيير."
                }
            },
            en: {
                greetings: ["Hello! How can I help you?", "Hi there, I'm here to help."],
                presence: ["Yes, I'm here", "I'm listening"],
                repeat: ["I heard you the first time, should I explain more?", "Yes, still here..."],
                emotions: {
                    "sad": "I'm sorry to hear that. Would you like to talk about what's bothering you?",
                    "lonely": "Loneliness can be hard, but remember you're not alone.",
                    "money problems": "Try breaking down the problem into smaller steps to solve it.",
                    "anxious": "Take a deep breath, things will get better with time.",
                    "tired": "Rest is very important for your health, don't neglect it.",
                    "nobody understands": "I'm here to understand you, you can talk freely.",
                    "don't know what to do": "Try taking your time to think, good decisions need patience.",
                    "stressed": "Try breathing exercises or listening to calm music.",
                    "no motivation": "Start with something small, small steps lead to big results.",
                    "feel bad": "Acknowledging this is a good start for change."
                }
            },
            ru: {
                greetings: ["Привет! Как я могу вам помочь?", "Здравствуйте, я здесь чтобы помочь."],
                presence: ["Да, я здесь", "Я вас слушаю"],
                repeat: ["Я услышал вас в первый раз, объяснить подробнее?", "Да, всё ещё здесь..."],
                emotions: {
                    "грустно": "Мне жаль это слышать. Хотите поговорить об этом?",
                    "одиноко": "Одиночество может быть тяжёлым, но помните - вы не один.",
                    "денежные проблемы": "Попробуйте разбить проблему на более мелкие шаги.",
                    "тревожусь": "Глубоко вдохните, со временем всё наладится.",
                    "устал": "Отдых очень важен для вашего здоровья, не пренебрегайте им.",
                    "меня никто не понимает": "Я здесь чтобы понять вас, вы можете говорить свободно.",
                    "не знаю что делать": "Попробуйте не спешить с решением, хорошие решения требуют времени.",
                    "стресс": "Попробуйте дыхательные упражнения или спокойную музыку.",
                    "нет мотивации": "Начните с малого, небольшие шаги приводят к большим результатам.",
                    "плохо себя чувствую": "Признание этого - хорошее начало для изменений."
                }
            },
            default: {
                ar: "أنا هنا لمساعدتك. هل يمكنك أن تخبرني المزيد؟",
                en: "I'm here to help. Can you tell me more?",
                ru: "Я здесь чтобы помочь. Можете рассказать подробнее?"
            }
        };

        function addMessage(text, sender) {
            const messageDiv = document.createElement("div");
            messageDiv.classList.add("message", sender, "animate__animated", "animate__fadeIn");

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
            const userMessage = inputField.value.trim();
            if (userMessage === "") return;

            addMessage(userMessage, "user");
            inputField.value = "";

            setTimeout(() => {
                // تحديد لغة المستخدم
                const userLang = memory.detectLanguage(userMessage);
                const userMessageLower = userMessage.toLowerCase();
                
                // التحقق من التكرار
                const isRepeat = memory.lastMessages.some(msg => 
                    msg.text.toLowerCase() === userMessageLower && 
                    msg.lang === userLang
                );
                
                // حفظ الرسالة في الذاكرة
                memory.lastMessages.push({
                    text: userMessage,
                    lang: userLang,
                    time: new Date()
                });
                
                // الاحتفاظ بآخر 5 رسائل فقط
                if (memory.lastMessages.length > 5) {
                    memory.lastMessages.shift();
                }

                let botResponse;
                
                if (isRepeat) {
                    botResponse = responses[userLang].repeat[Math.floor(Math.random() * responses[userLang].repeat.length)];
                }
                else if (userMessageLower.includes("أنت هنا") || 
                         userMessageLower.includes("you there") || 
                         userMessageLower.includes("ты здесь")) {
                    botResponse = responses[userLang].presence[Math.floor(Math.random() * responses[userLang].presence.length)];
                }
                else {
                    // البحث عن رد عاطفي مطابق
                    const emotions = responses[userLang].emotions;
                    const matchedKey = Object.keys(emotions).find(key => 
                        userMessageLower.includes(key.toLowerCase())
                    );
                    
                    botResponse = matchedKey ? emotions[matchedKey] : responses.default[userLang];
                }
                
                addMessage(botResponse, "bot");
            }, 500);
        }

        sendButton.addEventListener("click", sendMessage);
        inputField.addEventListener("keypress", function (event) {
            if (event.key === "Enter") {
                sendMessage();
            }
        });
    }

    // ✅ فلترة المكتبة
    window.filterContent = function () {
        let input = document.getElementById("searchInput").value.toLowerCase();
        let items = document.querySelectorAll(".library-item");

        items.forEach(item => {
            let text = item.innerText.toLowerCase();
            item.style.display = text.includes(input) ? "block" : "none";
        });
    };

    window.filterCategory = function (category) {
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
    };

    // ✅ تأكيد الحجز
    const form = document.getElementById("booking-form");
    const formBox = document.getElementById("form-box");
    const thanksMessage = document.getElementById("thanks-message");

    if (form && formBox && thanksMessage) {
        form.addEventListener("submit", function (e) {
            e.preventDefault();
            formBox.style.display = "none";
            thanksMessage.style.display = "block";
        });
    }
});