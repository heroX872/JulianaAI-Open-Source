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

    // ======================
    // TÍTULO
    // ======================

    const titleEl = document.createElement('div');

    titleEl.id = 'chatTitle';

    titleEl.style.position = 'absolute';
    titleEl.style.left = '50%';
    titleEl.style.transform = 'translateX(-50%)';
    titleEl.style.fontSize = '1.5rem';
    titleEl.style.fontWeight = '500';
    titleEl.style.whiteSpace = 'nowrap';
    titleEl.style.overflow = 'hidden';
    titleEl.style.textOverflow = 'ellipsis';
    titleEl.style.maxWidth = '70%';
    titleEl.style.display = 'none';

    document.querySelector('.header-content').appendChild(titleEl);

    // ======================
    // DATABASE
    // ======================

    const request = indexedDB.open('JulianaAI_DB', 2);

    request.onupgradeneeded = (event) => {

        db = event.target.result;

        if (!db.objectStoreNames.contains('conversations')) {

            db.createObjectStore('conversations', {
                keyPath: 'id'
            });
        }
    };

    request.onsuccess = (event) => {

        db = event.target.result;

        loadHistory();

        const transaction = db.transaction(['conversations'], 'readonly');

        const store = transaction.objectStore('conversations');

        const getAll = store.getAll();

        getAll.onsuccess = () => {

            const conversations = getAll.result;

            if (conversations.length > 0) {

                const lastChat = conversations[conversations.length - 1];

                loadConversation(lastChat.id);

            } else {

                createNewConversation();
            }
        };
    };

    request.onerror = () => {

        console.error('Erro ao abrir IndexedDB');
    };

    // ======================
    // MENU
    // ======================

    const toggleMenu = (show) => {

        if (show) {

            sidebar.classList.add('open');

            overlay.classList.add('visible');

        } else {

            sidebar.classList.remove('open');

            overlay.classList.remove('visible');
        }
    };

    menuBtn.onclick = () => toggleMenu(true);

    closeBtn.onclick = () => toggleMenu(false);

    overlay.onclick = () => toggleMenu(false);

    // ======================
    // CONVERSAS
    // ======================

    function createNewConversation() {

        currentChatId = Date.now().toString();

        messagesEl.innerHTML = '';

        titleEl.textContent = '';

        logoContainer.style.display = 'block';

        titleEl.style.display = 'none';
    }

    function saveConversation() {

        if (!db || !currentChatId) return;

        const messages = [];

        document.querySelectorAll('.msg').forEach(msg => {

            messages.push({

                role: msg.classList.contains('user')
                    ? 'user'
                    : 'assistant',

                content: msg.querySelector('.msg-content').innerHTML
            });
        });

        let title = 'Nova conversa';

        const firstUser = document.querySelector('.msg.user .msg-content');

        if (firstUser) {

            title = firstUser.textContent.trim();

            if (title.length > 25) {

                title = title.substring(0, 25) + '...';
            }
        }

        const transaction = db.transaction(['conversations'], 'readwrite');

        const store = transaction.objectStore('conversations');

        store.put({
            id: currentChatId,
            title,
            messages
        });

        transaction.oncomplete = () => {

            loadHistory();
        };
    }

    function loadHistory() {

        historyList.innerHTML = '';

        const transaction = db.transaction(['conversations'], 'readonly');

        const store = transaction.objectStore('conversations');

        const getAll = store.getAll();

        getAll.onsuccess = () => {

            const conversations = [...getAll.result].reverse();

            conversations.forEach(chat => {

                const li = document.createElement('li');

                li.innerHTML = `
                    <a href="#" class="menu-link">
                        <span>💬</span>
                        ${chat.title}
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

        const transaction = db.transaction(['conversations'], 'readonly');

        const store = transaction.objectStore('conversations');

        const request = store.get(id);

        request.onsuccess = () => {

            const chat = request.result;

            if (!chat) return;

            messagesEl.innerHTML = '';

            chat.messages.forEach(msg => {

                addMessage(msg.role, msg.content, false);
            });

            titleEl.textContent = chat.title;

            titleEl.style.display = 'block';

            logoContainer.style.display = 'none';
        };
    }

    // ======================
    // MENSAGEM
    // ======================

    function addMessage(role, content, save = true) {

        const msgDiv = document.createElement('div');

        msgDiv.className = `msg ${role}`;

        msgDiv.innerHTML = `
            <div class="msg-content">${content}</div>
        `;

        messagesEl.prepend(msgDiv);

        if (save) {

            saveConversation();
        }

        updateHeader();
    }

    // ======================
    // HEADER
    // ======================

    function updateHeader() {

        const firstUserMsg =
            document.querySelector('.msg.user .msg-content');

        if (!firstUserMsg) {

            logoContainer.style.display = 'block';

            titleEl.style.display = 'none';

            return;
        }

        if (!titleEl.textContent) {

            let text = firstUserMsg.textContent.trim();

            if (text.length > 25) {

                text = text.substring(0, 25) + '...';
            }

            titleEl.textContent = text;
        }

        titleEl.style.display = 'block';

        logoContainer.style.display = 'none';
    }

    // ======================
    // ENVIAR
    // ======================

    sendBtn.onclick = () => {

        const text = inputEl.value.trim();

        if (!text) return;

        addMessage('user', text);

        inputEl.value = '';

        setTimeout(() => {

            addMessage(
                'assistant',
                'deu algum erro na API, poderia verificar?'
            );

        }, 600);
    };

    // ENTER
    inputEl.addEventListener('keydown', (e) => {

        if (e.key === 'Enter' && !e.shiftKey) {

            e.preventDefault();

            sendBtn.click();
        }
    });

    // ======================
    // NOVA CONVERSA
    // ======================

    document.getElementById('newChatBtn').onclick = (e) => {

        e.preventDefault();

        createNewConversation();

        toggleMenu(false);
    };

});