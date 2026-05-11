document.addEventListener('DOMContentLoaded', () => {
    const messagesEl = document.getElementById('messages');
    const inputEl = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    const logoContainer = document.getElementById('logoContainer');
    const chatTitle = document.getElementById('chatTitle');
    const sidebar = document.getElementById('sidebarMenu');
    const overlay = document.getElementById('menuOverlay');
    const menuBtn = document.getElementById('menuBtn');
    const closeBtn = document.getElementById('closeMenuBtn');
    const newChatBtn = document.getElementById('newChatBtn');

    let history = [];
    let isFirstMessage = true;

    // Controle da Sidebar
    const toggleMenu = (show) => {
        if(show) { sidebar.classList.add('open'); overlay.classList.add('visible'); }
        else { sidebar.classList.remove('open'); overlay.classList.remove('visible'); }
    };

    menuBtn.onclick = () => toggleMenu(true);
    closeBtn.onclick = () => toggleMenu(false);
    overlay.onclick = () => toggleMenu(false);

    // Resetar para nova conversa
    newChatBtn.onclick = (e) => {
        e.preventDefault();
        messagesEl.innerHTML = '';
        history = [];
        isFirstMessage = true;
        chatTitle.classList.add('hidden');
        chatTitle.classList.remove('visible');
        logoContainer.classList.add('visible');
        logoContainer.classList.remove('hidden');
        toggleMenu(false);
    };

    function generateTitle(text) {
        const words = text.split(' ');
        return words.length > 3 ? words.slice(0, 3).join(' ') + '...' : text;
    }

    async function sendMessage() {
        const text = inputEl.value.trim();
        if(!text) return;

        if (isFirstMessage) {
            chatTitle.textContent = generateTitle(text);
            logoContainer.classList.add('hidden');
            logoContainer.classList.remove('visible');
            chatTitle.classList.add('visible');
            chatTitle.classList.remove('hidden');
            isFirstMessage = false;
        }

        addMessage('user', text);
        history.push({role: 'user', content: text});
        inputEl.value = '';

        const loadingDiv = addMessage('assistant', '...');
        try {
            const res = await fetch("/chat", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({history})
            });
            const data = await res.json();
            loadingDiv.remove();
            addMessage('assistant', data.reply);
            history.push({role: 'assistant', content: data.reply});
        } catch(e) { 
            loadingDiv.textContent = "Erro de conexão."; 
        }
    }

    sendBtn.onclick = sendMessage;
    inputEl.onkeydown = (e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

    function addMessage(role, content) {
        const div = document.createElement('div');
        div.className = `msg ${role}`;
        div.innerHTML = `<div class="msg-content">${content}</div>`;
        messagesEl.appendChild(div);
        messagesEl.scrollTop = messagesEl.scrollHeight;
        return div;
    }
});
