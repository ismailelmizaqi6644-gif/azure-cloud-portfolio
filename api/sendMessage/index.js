const { Resend } = require('resend');

module.exports = async function (context, req) {
    try {
        const { name, email, message, date } = req.body || {};

        if (!name || !email || !message) {
            context.res = {
                status: 400,
                body: { status: "Error", message: "جميع الحقول مطلوبة!" }
            };
            return;
        }

        // 1. تسجيل الرسالة فـ Cosmos DB (إيلا كان مُعدّ)
        try {
            const newMessage = {
                id: new Date().getTime().toString(),
                name: name,
                email: email,
                message: message,
                createdAt: date || new Date().toISOString()
            };
            context.bindings.outputDocument = JSON.stringify(newMessage);
        } catch (dbErr) {
            context.log.error('CosmosDB Binding error:', dbErr);
        }

        // 2. إرسال الإشعار عبر Resend
        const apiKey = process.env["RESEND_API_KEY"];
        const myGmail = process.env["MY_GMAIL_ADDRESS"];

        if (apiKey && myGmail) {
            try {
                const resend = new Resend(apiKey);
                await resend.emails.send({
                    from: 'Portfolio Contact <onboarding@resend.dev>', // أو الدومين ديالك إيلا ربطتيه
                    to: myGmail,
                    subject: `📬 رسالة جديدة من Portfolio: ${name}`,
                    html: `
                        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #1f6feb; border-radius: 10px;">
                            <h2 style="color: #0078d4;">📬 رسالة جديدة من الـ Portfolio!</h2>
                            <p><strong>الاسم:</strong> ${name}</p>
                            <p><strong>الإيميل:</strong> <a href="mailto:${email}">${email}</a></p>
                            <hr style="border: 0.5px solid #ccc; margin: 15px 0;">
                            <p><strong>الرسالة:</strong></p>
                            <p style="background: #f4f4f4; padding: 10px; border-radius: 5px; color: #333;">${message}</p>
                        </div>
                    `
                });
            } catch (resendErr) {
                context.log.error('Resend error:', resendErr);
            }
        }

        // إرجاع نجاح للـ Frontend
        context.res = {
            status: 200,
            body: { status: "Success", message: "تم إرسال الرسالة بنجاح!" }
        };

    } catch (err) {
        context.log.error('General Function error:', err);
        context.res = {
            status: 200,
            body: { status: "Success", message: "تم استلام الرسالة" }
        };
    }
};
