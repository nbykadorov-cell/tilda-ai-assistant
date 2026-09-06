export default async function handler(req, res) {
    // --------------------------------------------------
    // 1. Разрешаем только POST
    // --------------------------------------------------
    if (req.method === "OPTIONS") {
        setCorsHeaders(req, res);
        return res.status(204).end();
    }

    if (req.method !== "POST") {
        setCorsHeaders(req, res);
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    // --------------------------------------------------
    // 2. CORS
    // --------------------------------------------------
    setCorsHeaders(req, res);

    // --------------------------------------------------
    // 3. Проверяем API-ключ OpenRouter
    // --------------------------------------------------
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
        return res.status(500).json({
            error: "OPENROUTER_API_KEY is not configured"
        });
    }

    try {
        // --------------------------------------------------
        // 4. Получаем сообщения от Tilda
        // --------------------------------------------------
        const { messages } = req.body || {};

        if (!Array.isArray(messages)) {
            return res.status(400).json({
                error: "messages must be an array"
            });
        }

        // --------------------------------------------------
        // 5. Защита от слишком больших запросов
        // --------------------------------------------------
        if (messages.length > 30) {
            return res.status(400).json({
                error: "Too many messages"
            });
        }

        // --------------------------------------------------
        // 6. Ограничиваем длину сообщений
        // --------------------------------------------------
        const safeMessages = messages
            .filter(item =>
                item &&
                typeof item.role === "string" &&
                typeof item.content === "string"
            )
            .map(item => ({
                role: item.role === "assistant" ? "assistant" : "user",
                content: item.content.slice(0, 5000)
            }));

        // --------------------------------------------------
        // 7. Системная инструкция для AI
        // --------------------------------------------------
        const systemMessage = {
            role: "system",
            content: `
Ты — полезный AI-помощник на персональном портале пользователя.

Отвечай на русском языке, если пользователь не просит другой язык.

Отвечай понятно, естественно и по делу.

Не говори, что ты человек.

Не выдумывай факты, если не уверен в них.

Используй предыдущие сообщения диалога, чтобы понимать контекст.

Если информации недостаточно для точного ответа — задай уточняющий вопрос.

Не перегружай ответ длинными вступлениями.

Форматируй ответы так, чтобы их было удобно читать в веб-чате.
            `.trim()
        };

        // --------------------------------------------------
        // 8. Запрашиваем бесплатную модель OpenRouter
        // --------------------------------------------------
        const response = await fetch(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                method: "POST",

                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json",

                    // Необязательные заголовки OpenRouter
                    "HTTP-Referer": "https://example.com",
                    "X-Title": "Tilda AI Assistant"
                },

                body: JSON.stringify({
                    model: "openrouter/free",

                    messages: [
                        systemMessage,
                        ...safeMessages
                    ],

                    temperature: 0.7,

                    max_tokens: 1000
                })
            }
        );

        // --------------------------------------------------
        // 9. Читаем ответ OpenRouter
        // --------------------------------------------------
        const data = await response.json();

        // --------------------------------------------------
        // 10. Обработка ошибки OpenRouter
        // --------------------------------------------------
        if (!response.ok) {
            console.error("OpenRouter error:", data);

            return res.status(response.status).json({
                error:
                    data?.error?.message ||
                    "OpenRouter returned an error"
            });
        }

        // --------------------------------------------------
        // 11. Получаем текст ответа AI
        // --------------------------------------------------
        const answer =
            data?.choices?.[0]?.message?.content;

        if (!answer) {
            return res.status(500).json({
                error: "AI returned an empty response"
            });
        }

        // --------------------------------------------------
        // 12. Возвращаем результат в Tilda
        // --------------------------------------------------
        return res.status(200).json({
            answer: answer
        });

    } catch (error) {

        console.error("Server error:", error);

        return res.status(500).json({
            error: "Internal server error"
        });
    }
}


// ==========================================================
// CORS
// ==========================================================

function setCorsHeaders(req, res) {

    const origin = req.headers.origin;

    const allowedOrigin =
        process.env.TILDA_ORIGIN || "*";

    if (
        allowedOrigin === "*" ||
        origin === allowedOrigin
    ) {
        res.setHeader(
            "Access-Control-Allow-Origin",
            allowedOrigin === "*" ? "*" : origin
        );
    }

    res.setHeader(
        "Access-Control-Allow-Methods",
        "POST, OPTIONS"
    );

    res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type"
    );

    res.setHeader(
        "Vary",
        "Origin"
    );
}
