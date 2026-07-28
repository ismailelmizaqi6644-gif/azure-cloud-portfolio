const { Resend } = require('resend');

module.exports = async function (context, req) {
    try {
        const body = req.body || {};
        const { name, email, message } = body;

        if (!name || !email || !message) {
            context.res = {
                status: 400,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "Error", message: "جميع الحقول مطلوبة!" })
            };
            return;
        }

        // 1. الإرسال عبر Resend (Notification)
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
            } catch (emailErr) {
                context.log.error('Email sending error:', emailErr);
            }
        }

        // 2. تسجيل البيانات فـ Azure Cosmos DB عبر REST API (خفيف ومباشر)
        const cosmosEndpoint = process.env["COSMOS_ENDPOINT"];
        const cosmosKey = process.env["COSMOS_KEY"];

        if (cosmosEndpoint && cosmosKey) {
            try {
                const cleanEndpoint = cosmosEndpoint.endsWith('/') ? cosmosEndpoint.slice(0, -1) : cosmosEndpoint;
                const dbId = "PortfolioDB";
                const containerId = "Messages";
                const date = new Date().toUTCString();
                
                const newItem = {
                    id: Date.now().toString(),
                    name: name,
                    email: email,
                    message: message,
                    createdAt: new Date().toISOString()
                };

                const crypto = require('crypto');
                const verb = "post";
                const resourceType = "docs";
                const resourceLink = `dbs/${dbId}/colls/${containerId}`;
                
                const stringToSign = `${verb}\n${resourceType}\n${resourceLink}\n${date.toLowerCase()}\n\n`;
                const keyBuffer = Buffer.from(cosmosKey, 'base64');
                const signature = crypto.createHmac('sha256', keyBuffer).update(stringToSign).digest('base64');
                const authToken = encodeURIComponent(`type=master&ver=1.0&sig=${signature}`);

                await fetch(`${cleanEndpoint}/${resourceLink}/docs`, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'x-ms-date': date,
                        'x-ms-version': '2018-12-31',
                        'authorization': authToken,
                        'x-ms-documentdb-is-upsert': 'true',
                        'x-ms-documentdb-partitionkey': JSON.stringify([newItem.email])
                    },
                    body: JSON.stringify(newItem)
                });
            } catch (dbErr) {
                context.log.error('Cosmos REST error:', dbErr);
            }
        }

        context.res = {
            status: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "Success", message: "تم إرسال الرسالة بنجاح!" })
        };

    } catch (error) {
        context.log.error('General Error:', error);
        context.res = {
            status: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "Success", message: "تم استلام الرسالة" })
        };
    }
};
     
