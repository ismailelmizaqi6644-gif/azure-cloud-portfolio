const sendgrid = require('@sendgrid/mail');

module.exports = async function (context, req) {
    const { name, email, message, date } = req.body || {};

    if (!name || !email || !message) {
        context.res = {
            status: 400,
            body: { status: "Error", message: "جميع الحقول مطلوبة!" }
        };
        return;
    }

    // 1. إعداد العنصر للحفظ فـ Cosmos DB
    const newMessage = {
        id: new Date().getTime().toString(),
        name: name,
        email: email,
        message: message,
        createdAt: date || new Date().toISOString()
    };

    context.bindings.outputDocument = JSON.stringify(newMessage);

    // 2. إرسال الإشعار للـ Gmail عبر SendGrid
    const apiKey = process.env["SENDGRID_API_KEY"];
    const myGmail = process.env["MY_GMAIL_ADDRESS"];

    if (apiKey && myGmail) {
        sendgrid.setApiKey(apiKey);
        const emailContent = {
            to: myGmail,
            from: myGmail,
            subject: `📬 رسالة جديدة من Portfolio: ${name}`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #1f6feb; border-radius: 10px;">
                    <h2 style="color: #0078d4;">📬 رسالة جديدة من الـ Portfolio!</h2>
                    <p><strong>الاسم:</strong> ${name}</p>
                    <p><strong>الإيميل:</strong> <a href="mailto:${email}">${email}</a></p>
                    <hr style="border: 0.5px solid #ccc; margin: 15px 0;">
                    <p><strong>الرسالة:</strong></p>
                    <p style="background: #f4f4f4; padding: 10px; border-radius: 5px;">${message}</p>
                </div>
            `
        };

        try {
            await sendgrid.send(emailContent);
        } catch (error) {
            context.log.error('خطأ فـ SendGrid:', error);
        }
    }

    context.res = {
        status: 200,
        body: { status: "Success", message: "تم تسجيل الرسالة وإرسال الإشعار!" }
    };
};
