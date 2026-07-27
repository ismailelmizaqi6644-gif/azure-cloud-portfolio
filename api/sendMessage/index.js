const { Resend } = require('resend');

module.exports = async function (context, req) {
    const { name, email, message } = req.body || {};

    if (!name || !email || !message) {
        context.res = {
            status: 400,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "Error", message: "جميع الحقول مطلوبة!" })
        };
        return;
    }

    const apiKey = process.env["RESEND_API_KEY"];
    const myGmail = process.env["MY_GMAIL_ADDRESS"];

    if (apiKey && myGmail) {
        try {
            const resend = new Resend(apiKey);
            await resend.emails.send({
                from: 'Portfolio <onboarding@resend.dev>',
                to: myGmail,
                subject: `📬 رسالة جديدة من: ${name}`,
                html: `
                    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #1f6feb; border-radius: 10px;">
                        <h2 style="color: #0078d4;">📬 رسالة جديدة من الـ Portfolio!</h2>
                        <p><strong>الاسم:</strong> ${name}</p>
                        <p><strong>الإيميل:</strong> ${email}</p>
                        <hr style="border: 0.5px solid #ccc; margin: 15px 0;">
                        <p><strong>الرسالة:</strong></p>
                        <p style="background: #f4f4f4; padding: 10px; border-radius: 5px; color: #333;">${message}</p>
                    </div>
                `
            });
        } catch (resendErr) {
            context.log.error('Resend Error:', resendErr);
        }
    }

    context.res = {
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Success", message: "تم إرسال الرسالة بنجاح!" })
    };
};
