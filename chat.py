import sys
from transformers import pipeline

# تحميل نموذج الذكاء الاصطناعي
pipe = pipeline("text-generation", model="klyang/MentaLLaMA-chat-7B")

# استقبال الرسالة من Node.js
user_input = sys.argv[1]  

# تشغيل النموذج على المدخلات
response = pipe(user_input, max_length=200, do_sample=True)

# طباعة الاستجابة لتتمكن Node.js من قراءتها
print(response[0]["generated_text"])
