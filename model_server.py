from flask import Flask, request, jsonify
from transformers import pipeline

app = Flask(__name__)
pipe = pipeline("text-generation", model="deepseek-ai/DeepSeek-R1", trust_remote_code=True)

@app.route("/generate", methods=["POST"])
def generate():
    data = request.json
    messages = data.get("messages", [])
    result = pipe(messages)
    return jsonify(result)

if __name__ == "__main__":
    app.run(port=5000)
