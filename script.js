const API_BASE_URL = "https://cat-logo-backend.onrender.com";

// Verifica se está dentro do Telegram WebApp
const tg = window.Telegram?.WebApp;
if (!tg?.initDataUnsafe?.user) {
  document.body.innerHTML = `
    <div class="container mt-5 text-center">
      <h3>Esta aplicação deve ser executada dentro do Telegram.</h3>
    </div>`;
  throw new Error("Acesso negado fora do Telegram");
}

// Inicializa Telegram WebApp
Telegram.WebApp.ready();

// Info do usuário
const user = tg.initDataUnsafe.user;
const userId = user.id;
const username = user.username || "sem_username";

// Verifica se o usuário é admin via GET /admins
async function isAdmin() {
  const res = await fetch(`${API_BASE_URL}/admins`);
  const admins = await res.json();
  return Array.isArray(admins) && admins.includes(userId);
}

// Carrega e exibe os canais
async function carregarCanais() {
  try {
    const res = await fetch(`${API_BASE_URL}/channels`);
    const canais = await res.json();
    const container = document.getElementById("canal-lista");
    container.innerHTML = "";

    canais.forEach(c => {
      const card = document.createElement("div");
      card.className = "card p-3";
      card.innerHTML = `
        <h5>${c.name}</h5>
        <p class="mb-1"><strong>Categoria:</strong> ${c.description || "N/A"}</p>
        <a href="${c.link}" target="_blank" class="btn btn-primary btn-sm">
          <i class="fas fa-paper-plane"></i> Acessar Canal
        </a>
        ${c.image ? `<img src="${c.image}" class="image-preview mt-3" alt="Imagem do canal">` : ""}
      `;
      container.appendChild(card);
    });

  } catch (err) {
    console.error("Erro ao carregar canais:", err);
  } finally {
    document.getElementById("loading").style.display = "none";
  }
}

// Preview da imagem no formulário
function previewImage() {
  const fileInput = document.getElementById("imagem-arquivo");
  const preview = document.getElementById("preview");
  const file = fileInput.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      preview.src = reader.result;
      preview.classList.remove("d-none");
    };
    reader.readAsDataURL(file);
  } else {
    preview.src = "";
    preview.classList.add("d-none");
  }
}

// Evento de mudança no input de arquivo
document.getElementById("imagem-arquivo").addEventListener("change", previewImage);

// Submissão do formulário para adicionar canal
document.getElementById("add-channel-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const nome = document.getElementById("nome").value;
  const link = document.getElementById("link").value;
  const categoria = document.getElementById("categoria").value;
  const imagemUrl = document.getElementById("imagem-url").value;
  const imagemFile = document.getElementById("imagem-arquivo").files[0];

  let imagemFinal = imagemUrl;

  // Upload do arquivo se fornecido
  if (imagemFile) {
    const formData = new FormData();
    formData.append("file", imagemFile);
    try {
      const upload = await fetch(`${API_BASE_URL}/upload`, {
        method: "POST",
        body: formData
      });
      const result = await upload.json();
      if (result?.url) {
        imagemFinal = result.url;
      }
    } catch (err) {
      console.error("Erro no upload da imagem:", err);
    }
  }

  // Envio do canal
  try {
    await fetch(`${API_BASE_URL}/channels`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: nome,
        description: categoria,
        link,
        image: imagemFinal,
        user_id: userId
      })
    });

    e.target.reset();
    document.getElementById("preview").classList.add("d-none");
    carregarCanais();
  } catch (err) {
    console.error("Erro ao adicionar canal:", err);
  }
});

// Inicialização principal
window.addEventListener("DOMContentLoaded", async () => {
  if (await isAdmin()) {
    document.getElementById("admin-panel").classList.remove("d-none");
    document.getElementById("admin-info").textContent =
      `Conectado como admin: ${username} (ID: ${userId})`;
  }
  carregarCanais();
});
