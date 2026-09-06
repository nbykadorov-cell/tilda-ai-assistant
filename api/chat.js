export default async function handler(req, res) {

    // -----------------------------
    // CORS
    // -----------------------------

    const origin = req.headers.origin;

    const allowedOrigin =
        process.env.TILDA_ORIGIN;
    
    if (origin === allowedOrigin) {

    res.setHeader(
        "Access-Control-Allow-Origin",
        origin
    );

}

res.setHeader(
    "Vary",
    "Origin"
);

    res.setHeader(
        "Access-Control-Allow-Methods",
        "POST, OPTIONS"
    );

    res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type"
    );


    // -----------------------------
    // OPTIONS
    // -----------------------------

    if (req.method === "OPTIONS") {

        return res.status(204).end();

    }


    // -----------------------------
    // Только POST
    // -----------------------------

    if (req.method !== "POST") {

        return res.status(405).json({
            error: "Method not allowed"
        });

    }


    // -----------------------------
    // API KEY
    // -----------------------------

    const apiKey =
        process.env.OPENROUTER_API_KEY;


    if (!apiKey) {

        return res.status(500).json({
            error: "OPENROUTER_API_KEY is not configured"
        });

    }


    try {

        // -----------------------------
        // Получаем body
        // -----------------------------

        const body = req.body || {};

        const messages =
            body.messages;


        if (!Array.isArray(messages)) {

            return res.status(400).json({
                error: "messages must be an array"
            });

        }


        // -----------------------------
        // Ограничиваем историю
        // -----------------------------

        const safeMessages =
            messages
                .filter(message =>
                    message &&
                    typeof message.role === "string" &&
                    typeof message.content === "string"
                )
                .map(message => ({
                    role:
                        message.role === "assistant"
                            ? "assistant"
                            : "user",

                    content:
                        message.content.slice(0, 5000)
                }))
                .slice(-30);


        // -----------------------------
        // System prompt
        // -----------------------------

        const systemMessage = {

            role: "system",

            content: `
Ты — AI-помощник на персональном портале.

Отвечай на русском языке.

Отвечай понятно, естественно и по делу.

Используй предыдущий контекст диалога.

Не выдумывай факты.

Если информации недостаточно — задай уточняющий вопрос.

Не используй длинные вступления.
            `.trim()

        };


        // -----------------------------
        // Запрос OpenRouter
        // -----------------------------

        const openRouterResponse =
            await fetch(
                "https://openrouter.ai/api/v1/chat/completions",
                {

                    method: "POST",

                    headers: {

                        "Authorization":
                            `Bearer ${apiKey}`,

                        "Content-Type":
                            "application/json"

                    },

                    body: JSON.stringify({

                        model:
                            "openrouter/free",

                        messages: [
                            systemMessage,
                            ...safeMessages
                        ],

                        temperature: 0.7,

                        max_tokens: 1000

                    })

                }
            );


        // -----------------------------
        // Получаем ответ
        // -----------------------------

        const data =
            await openRouterResponse.json();


        // -----------------------------
        // Ошибка OpenRouter
        // -----------------------------

        if (!openRouterResponse.ok) {

            console.error(
                "OpenRouter error:",
                data
            );

            return res
                .status(openRouterResponse.status)
                .json({

                    error:
                        data?.error?.message ||
                        "OpenRouter error"

                });

        }


        // -----------------------------
        // Ответ AI
        // -----------------------------

        const answer =
            data?.choices?.[0]?.message?.content;


        if (!answer) {

            return res.status(500).json({
                error: "AI returned empty response"
            });

        }


        return res.status(200).json({

            answer: answer

        });


    } catch (error) {

        console.error(
            "Server error:",
            error
        );

        return res.status(500).json({

            error:
                error?.message ||
                "Internal server error"

        });

    }

}
