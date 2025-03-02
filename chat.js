import { exec } from "child_process";

function chatWithAI(message) {
    exec(`python chat.py "${message}"`, (error, stdout, stderr) => {
        if (error) {
            console.error(`❌ Error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`⚠️ Stderr: ${stderr}`);
            return;
        }
        console.log(`🤖 AI Response: ${stdout}`);
    });
}

// اختبار الكود
chatWithAI("How can I improve my mental health?");
