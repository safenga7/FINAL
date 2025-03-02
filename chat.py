import sys
from transformers import pipeline

# تحميل النموذج
pipe = pipeline("text-generation", model="ai-forever/rugpt3large_based_on_gpt2")

# استقبال الرسالة من Node.js
user_input = sys.argv[1]

# توليد الرد باستخدام النموذج
response = pipe(user_input, max_length=100, num_return_sequences=1)

# طباعة النتيجة حتى يتم التقاطها في Node.js
print(response[0]['generated_text'])
