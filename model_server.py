from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import pipeline
import os
from dotenv import load_dotenv
import logging
from logging.handlers import RotatingFileHandler

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
handler = RotatingFileHandler('ai_model.log', maxBytes=10000000, backupCount=5)
handler.setFormatter(logging.Formatter(
    '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
))
logger.addHandler(handler)

app = Flask(__name__)
CORS(app)

try:
    # Initialize the model with proper configuration
    pipe = pipeline(
        "text-generation",
        model="deepseek-ai/DeepSeek-R1",
        trust_remote_code=True,
        device="cuda" if os.getenv("USE_GPU", "false").lower() == "true" else "cpu"
    )
    logger.info("Model loaded successfully")
except Exception as e:
    logger.error(f"Error loading model: {str(e)}")
    raise

@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({"status": "healthy", "model": "deepseek-ai/DeepSeek-R1"})

@app.route("/generate", methods=["POST"])
def generate():
    try:
        data = request.json
        if not data or 'messages' not in data:
            return jsonify({"error": "No messages provided"}), 400

        messages = data['messages']
        if not isinstance(messages, str):
            return jsonify({"error": "Messages must be a string"}), 400

        # Generate response with proper parameters
        result = pipe(
            messages,
            max_length=500,
            num_return_sequences=1,
            temperature=0.7,
            top_p=0.9,
            do_sample=True
        )

        # Extract the generated text
        generated_text = result[0]['generated_text']
        
        # Remove the input prompt from the response if it's included
        if generated_text.startswith(messages):
            generated_text = generated_text[len(messages):].strip()

        return jsonify({
            "response": generated_text,
            "status": "success"
        })

    except Exception as e:
        logger.error(f"Error generating response: {str(e)}")
        return jsonify({
            "error": "Failed to generate response",
            "details": str(e)
        }), 500

if __name__ == "__main__":
    port = int(os.getenv("AI_MODEL_PORT", 5000))
    debug = os.getenv("FLASK_DEBUG", "false").lower() == "true"
    
    app.run(
        host="0.0.0.0",
        port=port,
        debug=debug
    )
