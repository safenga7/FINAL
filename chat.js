// استيراد `exec` من مكتبة child_process لتشغيل أوامر النظام
import { exec } from "child_process";

// دالة للتواصل مع الذكاء الاصطناعي
function chatWithAI(message) {
    // تشغيل كود بايثون وإرسال الرسالة إليه
    exec(`python chat.py "${message}"`, (error, stdout, stderr) => {
        if (error) {
            console.error(` Error: ${error.message}`); // طباعة الخطأ إن وجد
            return;
        }
        if (stderr) {
            console.error(` Stderr: ${stderr}`); // طباعة أي تحذيرات من بايثون
            return;
        }
        console.log(` AI Response: ${stdout}`); // طباعة رد الذكاء الاصطناعي
    });
}

// تجربة إرسال رسالة للنموذج
chatWithAI("How can I improve my mental health?");
