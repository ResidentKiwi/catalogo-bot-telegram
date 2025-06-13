// script.js - Gerenciamento do catálogo de canais no Telegram WebApp

// Checa se estamos dentro do Telegram WebApp
if (typeof Telegram === "undefined" || !Telegram.WebApp) {
    // Mostrar aviso e encerrar se fora do Telegram
    document.addEventListener("DOMContentLoaded", () => {
        document.getElementById("outside-message").style.display = "block";
        document.getElementById("app-content").style.display = "none";
    });
} else {
    // Código principal dentro do WebApp
    Telegram.WebApp.ready();
    const userId = Telegram.WebApp.initDataUnsafe?.user?.id;
    let isAdmin = false;

    // Verificar se usuário atual é admin consultando a API
    fetch("/admins")
        .then(res => res.json())
        .then(data => {
            if (Array.isArray(data) && data.includes(userId)) {
                isAdmin = true;
                document.getElementById("admin-panel").style.display = "block";
            }
            loadChannels();
        });

    // Elementos do formulário de criação/edição
    const form = document.getElementById("add-channel-form");
    const nameInput = document.getElementById("channel-name");
    const descInput = document.getElementById("channel-desc");
    const linkInput = document.getElementById("channel-link");
    const imageInput = document.getElementById("channel-image");
    const imgPreview = document.getElementById("image-preview");
    const oldImageInput = document.getElementById("old-image-url");

    // Visualização da imagem ao selecionar um arquivo
    imageInput.addEventListener("change", () => {
        const file = imageInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = e => {
                imgPreview.src = e.target.result;
                imgPreview.style.display = "block";
            };
            reader.readAsDataURL(file);
        }
    });

    // Função para carregar e renderizar canais
    async function loadChannels() {
        document.getElementById("channels-container").innerHTML = "";
        try {
            const res = await fetch("/channels");
            const channels = await res.json();
            channels.forEach(ch => {
                const card = document.createElement("div");
                card.className = "card";
                card.innerHTML = `
                    <img src="${ch.image}" alt="${ch.name}">
                    <h3>${ch.name}</h3>
                    <p>${ch.description}</p>
                    <a href="${ch.link}" target="_blank">Acessar</a>
                `;
                // Se admin, adicionar botões Editar/Excluir
                if (isAdmin) {
                    const editBtn = document.createElement("button");
                    editBtn.textContent = "Editar";
                    editBtn.className = "edit-btn";
                    editBtn.onclick = () => startEditChannel(ch);
                    const deleteBtn = document.createElement("button");
                    deleteBtn.textContent = "Excluir";
                    deleteBtn.className = "delete-btn";
                    deleteBtn.onclick = () => deleteChannel(ch.id);
                    card.appendChild(editBtn);
                    card.appendChild(deleteBtn);
                }
                document.getElementById("channels-container").appendChild(card);
            });
        } catch (err) {
            console.error("Erro ao carregar canais:", err);
        }
    }

    // Função para iniciar edição de um canal
    function startEditChannel(ch) {
        // Preencher formulário com dados do canal
        form.dataset.editId = ch.id;
        nameInput.value = ch.name;
        descInput.value = ch.description;
        linkInput.value = ch.link;
        oldImageInput.value = ch.image;
        imgPreview.src = ch.image;
        imgPreview.style.display = "block";
        form.querySelector("button[type=submit]").textContent = "Salvar alterações";
        // Rolar para cima do painel
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    // Função para limpar formulário após envio
    function resetForm() {
        form.reset();
        imgPreview.src = "";
        imgPreview.style.display = "none";
        delete form.dataset.editId;
        oldImageInput.value = "";
        form.querySelector("button[type=submit]").textContent = "Adicionar Canal";
    }

    // Função para envio do formulário (criação ou edição)
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        // Preparar dados
        const name = nameInput.value.trim();
        const description = descInput.value.trim();
        const link = linkInput.value.trim();
        let imageUrl = oldImageInput.value;

        // Se um novo arquivo foi selecionado, fazer upload
        if (imageInput.files.length > 0) {
            const fileData = new FormData();
            fileData.append("file", imageInput.files[0]);
            try {
                const uploadRes = await fetch("/upload", {
                    method: "POST",
                    body: fileData
                });
                const uploadJson = await uploadRes.json();
                imageUrl = uploadJson.url;
            } catch (err) {
                console.error("Erro no upload da imagem:", err);
                alert("Falha no upload da imagem.");
                return;
            }
        }

        // Montar objeto canal
        const canal = { name, description, link, image: imageUrl, user_id: userId };

        try {
            if (form.dataset.editId) {
                // Atualizar canal existente
                const id = form.dataset.editId;
                const res = await fetch(`/channels/${id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(canal)
                });
                if (!res.ok) throw new Error("Falha ao atualizar");
                alert("Canal atualizado!");
            } else {
                // Criar novo canal
                const res = await fetch("/channels", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(canal)
                });
                if (!res.ok) throw new Error("Falha ao criar");
                alert("Canal adicionado!");
            }
        } catch (err) {
            console.error(err);
            alert(err.message);
        }
        resetForm();
        loadChannels();
    });

    // Função para excluir canal (apenas admin)
    async function deleteChannel(id) {
        if (!confirm("Tem certeza que deseja excluir este canal?")) return;
        try {
            const res = await fetch(`/channels/${id}?user_id=${userId}`, {
                method: "DELETE"
            });
            if (!res.ok) throw new Error("Falha ao excluir");
            alert("Canal excluído");
            loadChannels();
        } catch (err) {
            console.error(err);
            alert(err.message);
        }
    }
}
