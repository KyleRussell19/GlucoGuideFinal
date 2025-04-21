require("dotenv").config();
const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendGlucoseAlert(userEmail, glucoseValue, minThreshold, maxThreshold) {
    if (!userEmail) {
        console.error("🚨 Error: No email address provided!");
        return;
    }

    if (glucoseValue < minThreshold || glucoseValue > maxThreshold) {
        const msg = {
            to: userEmail,
            from: process.env.SENDER_EMAIL || "your_verified_email@gmail.com",
            subject: "🚨 Glucose Level Alert: Action Needed!",
            text: `Your glucose level is ${glucoseValue} mg/dL, which is outside your target range (${minThreshold}-${maxThreshold} mg/dL). Please take appropriate action.`,
            html: `
                <p>🚨 <strong>Glucose Alert!</strong></p>
                <p>Your recorded glucose level is <strong style="color:red;">${glucoseValue} mg/dL</strong>, which is <strong>outside</strong> your defined safe range of <strong>${minThreshold}-${maxThreshold} mg/dL</strong>.</p>
                <p><strong>Recommended Action:</strong> Consult with your healthcare provider or follow your normal treatment plan.</p>
                <p>Stay safe and take care!</p>
                <hr />
                <p style="font-size:12px;color:gray;">This is an automated message from GlucoGuide. Please do not reply.</p>
            `,
        };

        try {
            await sgMail.send(msg);
            console.log(`Email sent successfully to ${userEmail} with thresholds [Min: ${minThreshold}, Max: ${maxThreshold}]`);
        } catch (error) {
            console.error("Failed to send email:", error.response?.body || error.message || error);
        }
    }
}

module.exports = sendGlucoseAlert;
