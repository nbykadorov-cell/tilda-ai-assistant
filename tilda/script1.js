(function () {

    "use strict";


    // ==================================================
    // API
    // ==================================================

    const API_URL =
        "https://tilda-ai-assistant.vercel.app/api/chat";


    // ==================================================
    // CONFIG
    // ==================================================

    const MAX_MESSAGE_LENGTH =
        4000;

    const MAX_MESSAGES =
        30;

    const MAX_REQUESTS_PER_MINUTE =
        15;


    // ==================================================
    // ELEMENTS
    // ==================================================

    const openButton =
        document.getElementById(
            "ai-open-button"
        );

    const closeButton =
        document.getElementById(
            "ai-close-button"
        );

    const newChatButton =
        document.getElementById(
            "ai-new-chat"
        );

    const overlay =
        document.getElementById(
            "ai-overlay"
        );

    const popup =
        document.getElementById(
            "ai-popup"
        );

    const messagesBox =
        document.getElementById(
            "ai-messages"
        );

    const input =
        document.getElementById(
            "ai-input"
        );

    const sendButton =
        document.getElementById(
            "ai-send"
        );

    const uploadButton =
        document.getElementById(
            "ai-upload"
        );

    const fileInput =
        document.getElementById(
            "ai-file"
        );

    const micButton =
        document.getElementById(
            "ai-mic"
        );

    const attachmentBox =
        document.getElementById(
            "ai-attachment"
        );

    const attachmentName =
        document.getElementById(
            "ai-attachment-name"
        );

    const removeAttachment =
        document.getElementById(
            "ai-remove-attachment"
        );

    const clearButton =
        document.getElementById(
            "ai-clear"
        );

    const modeHints =
        document.getElementById(
            "ai-mode-hints"
        );

    const modeButtons =
        document.querySelectorAll(
            ".ai-mode"
        );

    const contextLabel =
        document.getElementById(
            "ai-context-label"
        );

    const toneToggle =
        document.getElementById(
            "ai-tone-toggle"
        );

    const tonePanel =
        document.getElementById(
            "ai-tone-panel"
        );

    const toneButtons =
        document.querySelectorAll(
            "[data-tone]"
        );


    // ==================================================
    // MORTGAGE ELEMENTS
    // ==================================================

    const mortgageBox =
        document.getElementById(
            "ai-mortgage"
        );

    const mortgagePrice =
        document.getElementById(
            "mortgage-price"
        );

    const mortgageDown =
        document.getElementById(
            "mortgage-down"
        );

    const mortgageRate =
        document.getElementById(
            "mortgage-rate"
        );

    const mortgageYears =
        document.getElementById(
            "mortgage-years"
        );

    const mortgageCalculate =
        document.getElementById(
            "mortgage-calculate"
        );

    const mortgageResult =
        document.getElementById(
            "mortgage-result"
        );

    const mortgageSendAI =
        document.getElementById(
            "mortgage-send-ai"
        );


    // ==================================================
    // STATE
    // ==================================================

    let currentMode =
        localStorage.getItem(
            "tilda_ai_last_mode"
        ) || "general";


    let currentTone =
        localStorage.getItem(
            "tilda_ai_tone"
        ) || "default";


    let attachedImage =
        null;


    let isSending =
        false;


    let requestTimes =
        [];


    // ==================================================
    // HISTORIES
    // ==================================================

    let histories = {};


    try {

        const saved =
            localStorage.getItem(
                "tilda_ai_histories_v4"
            );

        if (saved) {

            histories =
                JSON.parse(saved);

        }

    } catch (error) {

        histories = {};

    }


    function getHistory(
        mode
    ) {

        if (
            !Array.isArray(
                histories[mode]
            )
        ) {

            histories[mode] = [];

        }


        return histories[mode];

    }


    function saveHistories() {

        try {

            localStorage.setItem(
                "tilda_ai_histories_v4",
                JSON.stringify(
                    histories
                )
            );

        } catch (error) {

            console.warn(
                "History save error",
                error
            );

        }

    }


    // ==================================================
    // CONTEXT CURRENT PAGE
    // ==================================================

    function collectPageContext() {

        const parts = [];


        // ----------------------------------------------
        // Page title
        // ----------------------------------------------

        if (
            document.title
        ) {

            parts.push(
                "Название страницы: " +
                document.title
            );

        }


        // ----------------------------------------------
        // Meta description
        // ----------------------------------------------

        const description =
            document.querySelector(
                'meta[name="description"]'
            );


        if (
            description?.content
        ) {

            parts.push(
                "Описание страницы: " +
                description.content.slice(
                    0,
                    1000
                )
            );

        }


        // ----------------------------------------------
        // Tilda title blocks
        // ----------------------------------------------

        document
            .querySelectorAll(
                ".t-title, .t-descr, .t-heading"
            )
            .forEach(
                function (element) {

                    const text =
                        element.innerText?.trim();


                    if (
                        text &&
                        text.length > 1 &&
                        text.length < 1000
                    ) {

                        parts.push(
                            text
                        );

                    }

                }
            );


        // ----------------------------------------------
        // Специальные AI поля
        //
        // Можно использовать:
        //
        // <div data-ai-field="Цена">
        //   7 800 000 ₽
        // </div>
        //
        // ----------------------------------------------

        document
            .querySelectorAll(
                "[data-ai-field]"
            )
            .forEach(
                function (element) {

                    const label =
                        element.dataset.aiField;


                    const value =
                        element.innerText?.trim();


                    if (
                        label &&
                        value
                    ) {

                        parts.push(
                            label +
                            ": " +
                            value
                        );

                    }

                }
            );


        // ----------------------------------------------
        // Дополнительный объект
        //
        // Если на странице установлен:
        //
        // window.AI_OBJECT_DATA = {
        //   ЖК: "Придонье",
        //   Цена: "7800000"
        // }
        //
        // ----------------------------------------------

        if (
            window.AI_OBJECT_DATA &&
            typeof window.AI_OBJECT_DATA === "object"
        ) {

            Object.entries(
                window.AI_OBJECT_DATA
            ).forEach(
                function (
                    [
                        key,
                        value
                    ]
                ) {

                    if (
                        value !== null &&
                        value !== undefined &&
                        String(value).trim()
                    ) {

                        parts.push(
                            key +
                            ": " +
                            String(value)
                        );

                    }

                }
            );

        }


        // ----------------------------------------------
        // Удаляем дубли
        // ----------------------------------------------

        const unique =
            [...new Set(parts)];


        return unique
            .slice(
                0,
                50
            )
            .join("\n");

    }


    // ==================================================
    // CONTEXT LABEL
    // ==================================================

    const pageContext =
        collectPageContext();


    function getContextLabel() {

        const data =
            window.AI_OBJECT_DATA;


        if (
            data &&
            typeof data === "object"
        ) {

            const title =
                data["ЖК"] ||
                data["Название"] ||
                data["Объект"] ||
                data["Название объекта"];


            if (
                title
            ) {

                return (
                    "Объект: " +
                    title
                );

            }

        }


        return "Персональный помощник УРБАН ЭСТЕЙТ";

    }


    contextLabel.textContent =
        getContextLabel();


    // ==================================================
    // OPEN / CLOSE
    // ==================================================

    function openPopup() {

        popup.classList.remove(
            "ai-hidden"
        );

        overlay.classList.remove(
            "ai-hidden"
        );

        document.body.style.overflow =
            "hidden";

        // input.focus();

    }


    function closePopup() {

        popup.classList.add(
            "ai-hidden"
        );

        overlay.classList.add(
            "ai-hidden"
        );

        document.body.style.overflow =
            "";

    }


    openButton.addEventListener(
        "click",
        openPopup
    );


    closeButton.addEventListener(
        "click",
        closePopup
    );


    overlay.addEventListener(
        "click",
        closePopup
    );


    document.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Escape"
            ) {

                closePopup();

            }

        }
    );


    // ==================================================
    // SIMPLE MARKDOWN
    // ==================================================

    function escapeHTML(text) {

        return String(text)

            .replace(
                /&/g,
                "&amp;"
            )

            .replace(
                /</g,
                "&lt;"
            )

            .replace(
                />/g,
                "&gt;"
            )

            .replace(
                /"/g,
                "&quot;"
            )

            .replace(
                /'/g,
                "&#039;"
            );

    }


    function renderMarkdown(
        text
    ) {

        let html =
            escapeHTML(
                text
            );


        // code

        html =
            html.replace(
                /`([^`]+)`/g,
                "<code>$1</code>"
            );


        // bold

        html =
            html.replace(
                /\*\*(.*?)\*\*/g,
                "<strong>$1</strong>"
            );


        // italic

        html =
            html.replace(
                /\*(.*?)\*/g,
                "<em>$1</em>"
            );


        // headers

        html =
            html.replace(
                /^### (.*)$/gm,
                "<h3>$1</h3>"
            );


        // unordered list

        html =
            html.replace(
                /(?:^|\n)((?:- .*(?:\n|$))+)/g,
                function (
                    match
                ) {

                    const items =
                        match
                            .trim()
                            .split(
                                "\n"
                            )
                            .map(
                                item =>
                                    "<li>" +
                                    item
                                        .replace(
                                            /^- /,
                                            ""
                                        ) +
                                    "</li>"
                            )
                            .join("");

                    return (
                        "<ul>" +
                        items +
                        "</ul>"
                    );

                }
            );


        // ordered list

        html =
            html.replace(
                /(?:^|\n)((?:\d+\. .*(?:\n|$))+)/g,
                function (
                    match
                ) {

                    const items =
                        match
                            .trim()
                            .split(
                                "\n"
                            )
                            .map(
                                item =>
                                    "<li>" +
                                    item
                                        .replace(
                                            /^\d+\. /,
                                            ""
                                        ) +
                                    "</li>"
                            )
                            .join("");

                    return (
                        "<ol>" +
                        items +
                        "</ol>"
                    );

                }
            );


        // paragraphs

        html =
            html
                .split(
                    /\n{2,}/
                )
                .map(
                    block => {

                        if (
                            /^(<h3>|<ul>|<ol>)/.test(
                                block.trim()
                            )
                        ) {

                            return block;

                        }


                        return (
                            "<p>" +
                            block.replace(
                                /\n/g,
                                "<br>"
                            ) +
                            "</p>"
                        );

                    }
                )
                .join("");


        return html;

    }


    // ==================================================
    // ADD MESSAGE
    // ==================================================

    function addMessage(
        role,
        content,
        showTools = true
    ) {

        const wrapper =
            document.createElement(
                "div"
            );


        wrapper.className =
            "ai-message " +
            role;


        const bubble =
            document.createElement(
                "div"
            );


        bubble.className =
            "ai-message-bubble";


        if (
            role === "assistant"
        ) {

            bubble.classList.add(
                "ai-md"
            );


            bubble.innerHTML =
                renderMarkdown(
                    content
                );

        } else {

            bubble.textContent =
                content;

        }


        wrapper.appendChild(
            bubble
        );


        // ==================================================
        // TOOLS
        // ==================================================

        if (
            role === "assistant" &&
            showTools
        ) {

            const tools =
                document.createElement(
                    "div"
                );


            tools.className =
                "ai-message-tools";


            // COPY

            const copy =
                document.createElement(
                    "button"
                );


            copy.type =
                "button";


            copy.textContent =
                "Копировать";


            copy.addEventListener(
                "click",
                function () {

                    copyText(
                        content,
                        copy
                    );

                }
            );


            tools.appendChild(
                copy
            );


            // REGENERATE

            const regenerate =
                document.createElement(
                    "button"
                );


            regenerate.type =
                "button";


            regenerate.textContent =
                "Ещё вариант";


            regenerate.addEventListener(
                "click",
                function () {

                    regenerateLastResponse();

                }
            );


            tools.appendChild(
                regenerate
            );


            // SHORTER

            const shorter =
                document.createElement(
                    "button"
                );


            shorter.type =
                "button";


            shorter.textContent =
                "Короче";


            shorter.addEventListener(
                "click",
                function () {

                    modifyLastAnswer(
                        "Перепиши предыдущий ответ короче, сохранив смысл и важные факты."
                    );

                }
            );


            tools.appendChild(
                shorter
            );


            // LONGER

            const longer =
                document.createElement(
                    "button"
                );


            longer.type =
                "button";


            longer.textContent =
                "Подробнее";


            longer.addEventListener(
                "click",
                function () {

                    modifyLastAnswer(
                        "Перепиши предыдущий ответ подробнее, добавив полезные детали, но ничего не выдумывая."
                    );

                }
            );


            tools.appendChild(
                longer
            );


            // CLIENT

            const client =
                document.createElement(
                    "button"
                );


            client.type =
                "button";


            client.textContent =
                "Для клиента";


            client.addEventListener(
                "click",
                function () {

                    modifyLastAnswer(
                        "Перепиши предыдущий ответ так, чтобы он был понятен обычному клиенту по недвижимости. Убери профессиональный жаргон и сделай формулировки естественными."
                    );

                }
            );


            tools.appendChild(
                client
            );


            // // TONE

            // const tone =
            //     document.createElement(
            //         "button"
            //     );


            // tone.type =
            //     "button";


            // tone.textContent =
            //     "Тон";


            // tone.addEventListener(
            //     "click",
            //     function () {

            //         tonePanel.classList.toggle(
            //             "ai-hidden"
            //         );

            //     }
            // );


            // tools.appendChild(
            //     tone
            // );


            wrapper.appendChild(
                tools
            );

        }


        messagesBox.appendChild(
            wrapper
        );


        messagesBox.scrollTop =
            messagesBox.scrollHeight;


        return wrapper;

    }


    // ==================================================
    // COPY
    // ==================================================

    async function copyText(
        text,
        button
    ) {

        try {

            await navigator.clipboard.writeText(
                text
            );


            const old =
                button.textContent;


            button.textContent =
                "✓ Скопировано";


            setTimeout(
                function () {

                    button.textContent =
                        old;

                },
                1400
            );


        } catch (error) {

            const area =
                document.createElement(
                    "textarea"
                );


            area.value =
                text;


            document.body.appendChild(
                area
            );


            area.select();


            document.execCommand(
                "copy"
            );


            area.remove();

        }

    }


    // ==================================================
    // WELCOME
    // ==================================================

    const welcomes = {

        general:
            "Привет! 👋\n\nВыберите задачу выше или напишите, что нужно сделать.",

        property:
            "🏠 Готов помочь с объектом.\n\nМожно прислать характеристики, попросить найти преимущества или подготовить описание.",

        client:
            "👤 Пришлите сообщение клиента.\n\nЯ помогу подготовить естественный ответ.",

        telegram:
            "📢 Пришлите характеристики объекта.\n\nЯ подготовлю готовый пост для социальных сетей.",

        comparison:
            "📊 Пришлите характеристики двух или нескольких объектов.\n\nЯ помогу сравнить их.",

        mortgage:
            "💰 Заполните форму ипотечного калькулятора.",

        photo:
            "📷 Загрузите фотографию и напишите, что именно нужно проанализировать.",

        floorplan:
            "📐 Загрузите планировку для анализа."

    };


    // ==================================================
    // HINTS
    // ==================================================

    const hints = {

        general: [
            "Помоги с задачей",
            "Проанализируй объект",
            "Напиши объявление",
            "Ответь клиенту"
        ],


        property: [
            "Проанализируй объект",
            "Выдели преимущества",
            "Напиши объявление",
            "Придумай заголовки",
        ],


        client: [
            "Клиент пишет: дорого",
            "Помоги ответить",
            "Подведи к просмотру",
            "Сними возражение"
        ],


        telegram: [
            "Сделай короткий пост",
            "Придумай 5 заголовков",
            "Сделай продающий пост",
            "Добавь призыв к действию"
        ],


        comparison: [
            "Сравни объекты",
            "Что лучше для семьи?",
            "Что выгоднее?",
            "Сделай таблицу"
        ]
        
    };


    function renderHints() {

        modeHints.innerHTML = "";


        const currentHints =
            hints[currentMode] ||
            [];


        currentHints.forEach(
            function (text) {

                const button =
                    document.createElement(
                        "button"
                    );


                button.className =
                    "ai-hint";


                button.type =
                    "button";


                button.textContent =
                    text;


                button.addEventListener(
                    "click",
                    function () {

                        input.value =
                            text;

                        resizeInput();

                        // input.focus();

                    }
                );


                modeHints.appendChild(
                    button
                );

            }
        );

    }


    // ==================================================
    // RENDER CHAT
    // ==================================================

    function renderChat() {

        messagesBox.innerHTML = "";


        const history =
            getHistory(
                currentMode
            );


        if (
            history.length === 0
        ) {

            addMessage(
                "assistant",
                welcomes[currentMode] ||
                welcomes.general,
                false
            );

            return;

        }


        history.forEach(
            function (message) {

                if (
                    typeof message.content === "string"
                ) {

                    addMessage(
                        message.role,
                        message.content,
                        message.role === "assistant"
                    );

                }

            }
        );

    }


    // ==================================================
    // CHANGE MODE
    // ==================================================

    function changeMode(
        mode
    ) {

        currentMode =
            mode;


        localStorage.setItem(
            "tilda_ai_last_mode",
            mode
        );


        modeButtons.forEach(
            function (button) {

                button.classList.toggle(
                    "active",
                    button.dataset.mode === mode
                );

            }
        );


        const isMortgage =
            mode === "mortgage";


        mortgageBox.classList.toggle(
            "ai-hidden",
            !isMortgage
        );


        messagesBox.classList.toggle(
            "ai-hidden",
            isMortgage
        );


        document
            .getElementById(
                "ai-input-area"
            )
            .classList.toggle(
                "ai-hidden",
                isMortgage
            );


        renderHints();

        renderChat();

    }


    modeButtons.forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    changeMode(
                        button.dataset.mode
                    );

                }
            );

        }
    );


    // ==================================================
    // REQUEST LIMIT
    // ==================================================

    function canSendRequest() {

        const now =
            Date.now();


        requestTimes =
            requestTimes.filter(
                function (time) {

                    return (
                        now - time <
                        60000
                    );

                }
            );


        if (
            requestTimes.length >=
            MAX_REQUESTS_PER_MINUTE
        ) {

            addMessage(
                "assistant",
                "Слишком много запросов подряд. Подождите немного и повторите.",
                false
            );

            return false;

        }


        requestTimes.push(
            now
        );


        return true;

    }


    // ==================================================
    // REQUEST AI
    // ==================================================

    async function requestAI(
        history,
        mode,
        tone = currentTone
    ) {

        if (
            history.length >
            MAX_MESSAGES
        ) {

            throw new Error(
                "История слишком большая. Начните новую переписку."
            );

        }


        const response =
            await fetch(
                API_URL,
                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            mode:
                                mode,

                            tone:
                                tone,

                            messages:
                                history.slice(
                                    -MAX_MESSAGES
                                ),

                            pageContext:
                                pageContext

                        })

                }
            );


        let data;


        try {

            data =
                await response.json();

        } catch (error) {

            throw new Error(
                "Сервер вернул некорректный ответ"
            );

        }


        if (!response.ok) {

            throw new Error(
                data?.error ||
                "Ошибка API"
            );

        }


        if (
            !data?.answer
        ) {

            throw new Error(
                "AI не вернул ответ"
            );

        }


        return data.answer;

    }


    // ==================================================
    // TYPING
    // ==================================================

    function showTyping() {

        const wrapper =
            document.createElement(
                "div"
            );


        wrapper.className =
            "ai-message assistant";


        wrapper.id =
            "ai-typing";


        wrapper.innerHTML = `
            <div class="ai-message-bubble">
                <div class="ai-typing">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;


        messagesBox.appendChild(
            wrapper
        );


        messagesBox.scrollTop =
            messagesBox.scrollHeight;

    }


    function hideTyping() {

        const element =
            document.getElementById(
                "ai-typing"
            );


        if (
            element
        ) {

            element.remove();

        }

    }


    // ==================================================
    // IMAGE
    // ==================================================

    uploadButton.addEventListener(
        "click",
        function () {

            fileInput.click();

        }
    );


    fileInput.addEventListener(
        "change",
        async function () {

            const file =
                fileInput.files?.[0];


            if (!file) {
                return;
            }


            if (
                !file.type.startsWith(
                    "image/"
                )
            ) {

                alert(
                    "Можно загрузить только изображение."
                );

                return;

            }


            try {

                const compressed =
                    await compressImage(
                        file
                    );


                attachedImage = {

                    data:
                        compressed,

                    name:
                        file.name

                };


                attachmentName.textContent =
                    file.name;


                attachmentBox.classList.remove(
                    "ai-hidden"
                );


                if (
                    currentMode !== "photo" &&
                    currentMode !== "floorplan"
                ) {

                    changeMode(
                        "photo"
                    );

                }

            } catch (error) {

                alert(
                    "Не удалось подготовить изображение."
                );

            }

        }
    );


    function compressImage(
        file
    ) {

        return new Promise(
            function (
                resolve,
                reject
            ) {

                const reader =
                    new FileReader();


                reader.onload =
                    function (event) {

                        const image =
                            new Image();


                        image.onload =
                            function () {

                                let width =
                                    image.width;

                                let height =
                                    image.height;


                                const max =
                                    1400;


                                if (
                                    width > max ||
                                    height > max
                                ) {

                                    if (
                                        width > height
                                    ) {

                                        height =
                                            Math.round(
                                                height *
                                                max /
                                                width
                                            );

                                        width =
                                            max;

                                    } else {

                                        width =
                                            Math.round(
                                                width *
                                                max /
                                                height
                                            );

                                        height =
                                            max;

                                    }

                                }


                                const canvas =
                                    document.createElement(
                                        "canvas"
                                    );


                                canvas.width =
                                    width;

                                canvas.height =
                                    height;


                                const ctx =
                                    canvas.getContext(
                                        "2d"
                                    );


                                ctx.drawImage(
                                    image,
                                    0,
                                    0,
                                    width,
                                    height
                                );


                                resolve(
                                    canvas.toDataURL(
                                        "image/jpeg",
                                        0.76
                                    )
                                );

                            };


                        image.onerror =
                            reject;


                        image.src =
                            event.target.result;

                    };


                reader.onerror =
                    reject;


                reader.readAsDataURL(
                    file
                );

            }
        );

    }


    removeAttachment.addEventListener(
        "click",
        function () {

            attachedImage =
                null;


            fileInput.value =
                "";


            attachmentBox.classList.add(
                "ai-hidden"
            );

        }
    );


    // ==================================================
    // SEND
    // ==================================================

    async function sendMessage() {

        if (
            isSending
        ) {

            return;

        }


        if (
            !canSendRequest()
        ) {

            return;

        }


        let text =
            input.value.trim();


        if (
            text.length >
            MAX_MESSAGE_LENGTH
        ) {

            text =
                text.slice(
                    0,
                    MAX_MESSAGE_LENGTH
                );

        }


        if (
            !text &&
            !attachedImage
        ) {

            return;

        }


        const history =
            getHistory(
                currentMode
            );


        let userMessage;


        if (
            attachedImage
        ) {

            const content =
                [];


            content.push({

                type:
                    "text",

                text:
                    text ||
                    (
                        currentMode ===
                        "floorplan"
                            ? "Проанализируй эту планировку."
                            : "Проанализируй эту фотографию."
                    )

            });


            content.push({

                type:
                    "image_url",

                image_url: {

                    url:
                        attachedImage.data

                }

            });


            userMessage = {

                role:
                    "user",

                content:
                    content

            };


        } else {

            userMessage = {

                role:
                    "user",

                content:
                    text

            };

        }


        history.push(
            userMessage
        );


        saveHistories();


        // SHOW

        addMessage(
            "user",
            text ||
            (
                currentMode ===
                "floorplan"
                    ? "📐 Анализ планировки"
                    : "📷 Анализ изображения"
            ),
            false
        );


        input.value =
            "";

        resizeInput();


        attachedImage =
            null;


        attachmentBox.classList.add(
            "ai-hidden"
        );


        isSending =
            true;


        sendButton.disabled =
            true;


        uploadButton.disabled =
            true;


        micButton.disabled =
            true;


        showTyping();


        try {

            const answer =
                await requestAI(
                    history,
                    currentMode
                );


            history.push({

                role:
                    "assistant",

                content:
                    answer

            });


            // Limit history

            if (
                history.length >
                MAX_MESSAGES
            ) {

                histories[
                    currentMode
                ] =
                    history.slice(
                        -MAX_MESSAGES
                    );

            }


            saveHistories();


            hideTyping();


            addMessage(
                "assistant",
                answer,
                true
            );


        } catch (error) {

            hideTyping();


            addMessage(
                "assistant",
                "Произошла ошибка.\n\n" +
                error.message,
                false
            );

        }


        isSending =
            false;


        sendButton.disabled =
            false;


        uploadButton.disabled =
            false;


        micButton.disabled =
            false;


        // input.focus();

    }


    sendButton.addEventListener(
        "click",
        sendMessage
    );


    input.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Enter" &&
                !event.shiftKey
            ) {

                event.preventDefault();

                sendMessage();

            }

        }
    );


    function resizeInput() {

        input.style.height =
            "auto";


        input.style.height =
            Math.min(
                input.scrollHeight,
                130
            ) + "px";

    }


    input.addEventListener(
        "input",
        resizeInput
    );


    // ==================================================
    // MODIFY ANSWER
    //
    // Служебная команда НЕ попадает
    // в пользовательский чат.
    // ==================================================

    async function modifyLastAnswer(
        instruction
    ) {

        if (
            isSending
        ) {

            return;

        }


        const history =
            getHistory(
                currentMode
            );


        if (
            history.length <
            2
        ) {

            return;

        }


        if (
            !canSendRequest()
        ) {

            return;

        }


        const lastAnswer =
            history[
                history.length - 1
            ];


        if (
            lastAnswer.role !==
            "assistant"
        ) {

            return;

        }


        const baseHistory =
            history.slice(
                0,
                -1
            );


        baseHistory.push({

            role:
                "user",

            content:
                instruction

        });


        isSending =
            true;


        showTyping();


        try {

            const answer =
                await requestAI(
                    baseHistory,
                    currentMode
                );


            history[
                history.length - 1
            ] = {

                role:
                    "assistant",

                content:
                    answer

            };


            saveHistories();


            hideTyping();


            renderChat();


        } catch (error) {

            hideTyping();


            addMessage(
                "assistant",
                "Ошибка: " +
                error.message,
                false
            );

        }


        isSending =
            false;

    }


    // ==================================================
    // REGENERATE
    // ==================================================

    async function regenerateLastResponse() {

        if (
            isSending
        ) {

            return;

        }


        const history =
            getHistory(
                currentMode
            );


        if (
            history.length <
            2
        ) {

            return;

        }


        if (
            !canSendRequest()
        ) {

            return;

        }


        const last =
            history[
                history.length - 1
            ];


        if (
            last.role !==
            "assistant"
        ) {

            return;

        }


        history.pop();


        saveHistories();


        renderChat();


        isSending =
            true;


        showTyping();


        try {

            const answer =
                await requestAI(
                    history,
                    currentMode
                );


            history.push({

                role:
                    "assistant",

                content:
                    answer

            });


            saveHistories();


            hideTyping();


            renderChat();


        } catch (error) {

            hideTyping();


            addMessage(
                "assistant",
                "Ошибка: " +
                error.message,
                false
            );

        }


        isSending =
            false;

    }


    // ==================================================
    // NEW CHAT
    // ==================================================

    newChatButton.addEventListener(
        "click",
        function () {

            const confirmed =
                confirm(
                    "Начать новую переписку в текущем режиме?"
                );


            if (
                !confirmed
            ) {

                return;

            }


            histories[
                currentMode
            ] = [];


            saveHistories();


            renderChat();


            // input.focus();

        }
    );


    // ==================================================
    // CLEAR
    // ==================================================

    clearButton.addEventListener(
        "click",
        function () {

            histories[
                currentMode
            ] = [];


            saveHistories();


            renderChat();

        }
    );


    // ==================================================
    // TONE
    // ==================================================

    toneButtons.forEach(
        function (button) {

            button.classList.toggle(
                "active",
                button.dataset.tone ===
                currentTone
            );


            button.addEventListener(
                "click",
                function () {

                    currentTone =
                        button.dataset.tone;


                    localStorage.setItem(
                        "tilda_ai_tone",
                        currentTone
                    );


                    toneButtons.forEach(
                        function (item) {

                            item.classList.toggle(
                                "active",
                                item.dataset.tone ===
                                currentTone
                            );

                        }
                    );


                    tonePanel.classList.add(
                        "ai-hidden"
                    );

                }
            );

        }
    );


    toneToggle.addEventListener(
        "click",
        function () {

            tonePanel.classList.toggle(
                "ai-hidden"
            );

        }
    );


    // ==================================================
    // MORTGAGE QUICK PERCENT
    // ==================================================

    document
        .querySelectorAll(
            "[data-down-percent]"
        )
        .forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        const price =
                            Number(
                                mortgagePrice.value
                            );


                        const percent =
                            Number(
                                button.dataset.downPercent
                            );


                        if (
                            price > 0
                        ) {

                            mortgageDown.value =
                                Math.round(
                                    price *
                                    percent /
                                    100
                                );

                        }

                    }
                );

            }
        );


    // ==================================================
    // MORTGAGE QUICK YEARS
    // ==================================================

    document
        .querySelectorAll(
            "[data-years]"
        )
        .forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        mortgageYears.value =
                            button.dataset.years;

                    }
                );

            }
        );


    // ==================================================
    // MORTGAGE CALC
    // ==================================================

    mortgageCalculate.addEventListener(
        "click",
        function () {

            const price =
                Number(
                    mortgagePrice.value
                );


            const down =
                Number(
                    mortgageDown.value
                );


            const annualRate =
                Number(
                    mortgageRate.value
                );


            const years =
                Number(
                    mortgageYears.value
                );


            if (
                !price ||
                !years ||
                annualRate < 0 ||
                down < 0 ||
                down >= price
            ) {

                mortgageResult.innerHTML = `

                    <div class="ai-result-card">
                        Проверьте введённые данные.
                    </div>

                `;


                mortgageSendAI.classList.add(
                    "ai-hidden"
                );


                return;

            }


            const principal =
                price - down;


            const months =
                years * 12;


            const monthlyRate =
                annualRate / 100 / 12;


            let monthlyPayment;


            if (
                monthlyRate === 0
            ) {

                monthlyPayment =
                    principal /
                    months;

            } else {

                monthlyPayment =
                    principal *
                    (
                        monthlyRate *
                        Math.pow(
                            1 + monthlyRate,
                            months
                        )
                    ) /
                    (
                        Math.pow(
                            1 + monthlyRate,
                            months
                        ) - 1
                    );

            }


            const totalPayment =
                monthlyPayment *
                months;


            const overpayment =
                totalPayment -
                principal;


            const money =
                function (
                    value
                ) {

                    return new Intl.NumberFormat(
                        "ru-RU",
                        {
                            maximumFractionDigits:
                                0
                        }
                    ).format(
                        Math.round(
                            value
                        )
                    ) + " ₽";

                };


            mortgageResult.innerHTML = `

                <div class="ai-result-card">

                    <div class="ai-result-main">

                        ${money(
                            monthlyPayment
                        )}

                        <div style="
                            font-size:12px;
                            color:#888;
                            font-weight:400;
                            margin-top:7px;
                        ">
                            Ежемесячный платёж
                        </div>

                    </div>


                    <div class="ai-result-row">
                        <span>Стоимость</span>
                        <strong>
                            ${money(price)}
                        </strong>
                    </div>


                    <div class="ai-result-row">
                        <span>Первоначальный взнос</span>
                        <strong>
                            ${money(down)}
                        </strong>
                    </div>


                    <div class="ai-result-row">
                        <span>Сумма кредита</span>
                        <strong>
                            ${money(principal)}
                        </strong>
                    </div>


                    <div class="ai-result-row">
                        <span>Общая выплата</span>
                        <strong>
                            ${money(totalPayment)}
                        </strong>
                    </div>


                    <div class="ai-result-row">
                        <span>Переплата</span>
                        <strong>
                            ${money(overpayment)}
                        </strong>
                    </div>

                </div>

            `;


            mortgageSendAI.classList.remove(
                "ai-hidden"
            );


            mortgageSendAI.dataset.prompt =

                "Поясни этот ипотечный расчёт простым языком. " +

                "Стоимость: " +
                money(price) +

                ". Первоначальный взнос: " +
                money(down) +

                ". Сумма кредита: " +
                money(principal) +

                ". Ставка: " +
                annualRate +
                "%. " +

                "Срок: " +
                years +
                " лет. " +

                "Ежемесячный платёж: " +
                money(monthlyPayment) +

                ". Общая выплата: " +
                money(totalPayment) +

                ". Переплата: " +
                money(overpayment) +

                ".";

        }
    );


    // ==================================================
    // SEND MORTGAGE TO AI
    // ==================================================

    mortgageSendAI.addEventListener(
        "click",
        async function () {

            const prompt =
                mortgageSendAI.dataset.prompt;


            if (
                !prompt ||
                isSending
            ) {

                return;

            }


            const history =
                getHistory(
                    "mortgage"
                );


            history.push({

                role:
                    "user",

                content:
                    prompt

            });


            saveHistories();


            changeMode(
                "mortgage"
            );


            messagesBox.classList.remove(
                "ai-hidden"
            );


            mortgageBox.classList.add(
                "ai-hidden"
            );


            document
                .getElementById(
                    "ai-input-area"
                )
                .classList.remove(
                    "ai-hidden"
                );


            addMessage(
                "user",
                "Поясни этот ипотечный расчёт.",
                false
            );


            isSending =
                true;


            showTyping();


            try {

                const answer =
                    await requestAI(
                        history,
                        "mortgage"
                    );


                history.push({

                    role:
                        "assistant",

                    content:
                        answer

                });


                saveHistories();


                hideTyping();


                addMessage(
                    "assistant",
                    answer,
                    true
                );


            } catch (error) {

                hideTyping();


                addMessage(
                    "assistant",
                    "Ошибка: " +
                    error.message,
                    false
                );

            }


            isSending =
                false;

        }
    );


    // ==================================================
    // VOICE
    // ==================================================

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;


    let recognition =
        null;


    if (
        SpeechRecognition
    ) {

        recognition =
            new SpeechRecognition();


        recognition.lang =
            "ru-RU";


        recognition.interimResults =
            true;


        recognition.continuous =
            false;


        recognition.onstart =
            function () {

                micButton.classList.add(
                    "recording"
                );

            };


        recognition.onend =
            function () {

                micButton.classList.remove(
                    "recording"
                );

            };


        recognition.onerror =
            function () {

                micButton.classList.remove(
                    "recording"
                );

            };


        recognition.onresult =
            function (event) {

                let transcript =
                    "";


                for (
                    let i =
                        event.resultIndex;
                    i <
                        event.results.length;
                    i++
                ) {

                    transcript +=
                        event.results[i][0]
                            .transcript;

                }


                input.value =
                    transcript;


                resizeInput();

            };


        micButton.addEventListener(
            "click",
            function () {

                try {

                    recognition.start();

                } catch (error) {

                    console.warn(
                        error
                    );

                }

            }
        );


    } else {

        micButton.addEventListener(
            "click",
            function () {

                alert(
                    "Голосовой ввод не поддерживается этим браузером."
                );

            }
        );

    }


    // ==================================================
    // INIT
    // ==================================================

    changeMode(
        currentMode
    );


})();
