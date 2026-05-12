document.addEventListener('DOMContentLoaded', () => {
    const messagesEl = document.getElementById('messages');
    const inputEl = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    const sidebar = document.getElementById('sidebarMenu');
    const menuBtn = document.getElementById('menuBtn');
    const closeBtn = document.getElementById('closeMenuBtn');
    const overlay = document.getElementById('menuOverlay');
    const logoContainer = document.getElementById('logoContainer');
    const historyList = document.getElementById('historyList');

    let db;
    let currentChatId = null;

    // HEADER TITLE
    const titleEl = document.createElement('div');
    titleEl.id = 'chatTitle';
    titleEl.style.cssText = `
        position:absolute;
        left:50%;
        transform:translateX(-50%);
        font-size:1.1rem;
        font-weight:500;
        white-space:nowrap;
        overflow:hidden;
        text-overflow:ellipsis;
        max-width:60%;
        display:none;
    `;
    document.querySelector('.header-content').appendChild(titleEl);

    // AUTO RESIZE
    inputEl.addEventListener('input', function () {
        this.style.height = 'auto';
        this.style.height = this.scrollHeight + 'px';
    });

    // =========================
    // DATABASE
    // =========================

    const request = indexedDB.open('JulianaAI_DB', 2);

    request.onupgradeneeded = (e) => {
        db = e.target.result;

        if (!db.objectStoreNames.contains('conversations')) {
            db.createObjectStore('conversations', {
                keyPath: 'id'
            });
        }
    };

    request.onsuccess = (e) => {
        db = e.target.result;

        loadHistory();

        const tx = db.transaction(['conversations'], 'readonly');
        const store = tx.objectStore('conversations');

        store.getAll().onsuccess = (ev) => {
            const conversations = ev.target.result;

            if (conversations.length > 0) {
                loadConversation(conversations[conversations.length - 1].id);
            } else {
                createNewConversation();
            }
        };
    };

    // =========================
    // MENU
    // =========================

    const toggleMenu = (show) => {
        sidebar.classList.toggle('open', show);
        overlay.classList.toggle('visible', show);
    };

    menuBtn.onclick = () => toggleMenu(true);
    closeBtn.onclick = () => toggleMenu(false);
    overlay.onclick = () => toggleMenu(false);

    // =========================
    // CHAT FUNCTIONS
    // =========================

    function createNewConversation() {
        currentChatId = Date.now().toString();

        messagesEl.innerHTML = '';

        titleEl.textContent = '';
        titleEl.style.display = 'none';

        logoContainer.style.display = 'block';

        inputEl.style.height = 'auto';

        saveConversation();
    }

    function addMessage(role, content, save = true) {
        const msgDiv = document.createElement('div');

        msgDiv.className = `msg ${role}`;

        msgDiv.innerHTML = `
            <div class="msg-content">${content}</div>
        `;

        messagesEl.prepend(msgDiv);

        updateHeader();

        if (save) {
            saveConversation();
        }
    }

    function getConversationMessages() {
        const messages = [];

        document.querySelectorAll('.msg').forEach(msg => {
            messages.push({
                role: msg.classList.contains('user')
                    ? 'user'
                    : 'assistant',

                content: msg.querySelector('.msg-content').textContent
            });
        });

        return messages.reverse();
    }

    function updateHeader() {
        const firstUserMsg = document.querySelector('.msg.user .msg-content');

        if (!firstUserMsg) {
            logoContainer.style.display = 'block';
            titleEl.style.display = 'none';
            return;
        }

        titleEl.textContent =
            firstUserMsg.textContent.substring(0, 25) + '...';

        titleEl.style.display = 'block';
        logoContainer.style.display = 'none';
    }

    function saveConversation() {
        if (!db || !currentChatId) return;

        const messages = getConversationMessages();

        let title = 'Nova conversa';

        const firstUser = messages.find(m => m.role === 'user');

        if (firstUser) {
            title =
                firstUser.content.substring(0, 25) +
                (firstUser.content.length > 25 ? '...' : '');
        }

        const tx = db.transaction(['conversations'], 'readwrite');

        const store = tx.objectStore('conversations');

        store.put({
            id: currentChatId,
            title,
            messages
        });

        tx.oncomplete = () => {
            loadHistory();
        };
    }

    function loadHistory() {
        historyList.innerHTML = '';

        const tx = db.transaction(['conversations'], 'readonly');

        const store = tx.objectStore('conversations');

        store.getAll().onsuccess = (e) => {
            const conversations = [...e.target.result].reverse();

            conversations.forEach(chat => {
                const li = document.createElement('li');

                li.innerHTML = `
                    <a href="#" class="menu-link">
                        <span>💬</span>${chat.title}
                    </a>
                `;

                li.onclick = () => {
                    loadConversation(chat.id);
                    toggleMenu(false);
                };

                historyList.appendChild(li);
            });
        };
    }

    function loadConversation(id) {
        currentChatId = id;

        const tx = db.transaction(['conversations'], 'readonly');

        const store = tx.objectStore('conversations');

        store.get(id).onsuccess = (e) => {
            const chat = e.target.result;

            if (!chat) return;

            messagesEl.innerHTML = '';

            [...chat.messages]
                .reverse()
                .forEach(msg => {
                    addMessage(msg.role, msg.content, false);
                });

            titleEl.textContent = chat.title;

            titleEl.style.display = 'block';

            logoContainer.style.display = 'none';
        };
    }

    // =========================
    // SEND MESSAGE
    // =========================

    async function sendMessage() {
        const text = inputEl.value.trim();

        if (!text) return;

        addMessage('user', text);

        inputEl.value = '';
        inputEl.style.height = 'auto';

        try {
            const response = await fetch(
                'https://TEU-WORKER.workers.dev',
                {
                    method: 'POST',

                    headers: {
                        'Content-Type': 'application/json'
                    },

                    body: JSON.stringify({
                        chatId: currentChatId,
                        messages: getConversationMessages()
                    })
                }
            );

            const data = await response.json();

            addMessage(
                'assistant',
                data.reply || 'Sem resposta.'
            );

        } catch (err) {

            console.error(err);

            addMessage(
                'assistant',
                'Erro ao conectar ao servidor.'
            );
        }
    }

    sendBtn.onclick = sendMessage;

    inputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // =========================
    // NEW CHAT
    // =========================

    document.getElementById('newChatBtn').onclick = (e) => {
        e.preventDefault();

        createNewConversation();

        toggleMenu(false);
    };
});