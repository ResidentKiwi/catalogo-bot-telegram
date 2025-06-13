const API_BASE_URL = "https://cat-logo-backend.onrender.com";

const tg = window.Telegram.WebApp;
if (!tg?.initDataUnsafe?.user) {
  document.body.innerHTML = "<div class='container mt-5 text-center'><h3>Esta aplicação deve ser executada dentro do Telegram.</h3></div>";
  throw new Error("Acesso negado fora do Telegram");
}

const user = tg.initDataUnsafe.user;
const userId = user.id;
const username = user.username || "sem_username";

const isAdmin = async () => {
  const res = await fetch(`${API_BASE_URL}/verificar-admin/${userId}`);
  const data = await res.json();
  return data.admin === true;
};

const carregarCanais = async () => {
  const res = await fetch(`${API_BASE_URL}/listar`);
  const canais = await res.json();
  const container = document.getElementById("canal-lista");
  container.innerHTML = "";
  canais.forEach(c => {
    const card = document.createElement("div");
    card.className = "card p-3";
    card.innerHTML = `
      <h5>${c.nome}</h5>
      <p class="mb-1"><strong>Categoria:</strong> ${c.categoria || "N/A"}</p>
      <a href="${c.link}" target="_blank" class="btn btn-primary btn-sm">
        <i class="fas fa-paper-plane"></i> Acessar Canal
      </a>
      ${c.imagem ? `<img src="${c.imagem}" class="image-preview mt-3" alt="Imagem do canal">` : ""}
    `;
    container.appendChild(card);
  });
  document.getElementById("loading").style.display = "none";
};

const previewImage = () => {
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
};

document.getElementById("imagem-arquivo").addEventListener("change", previewImage);

document.getElementById("add-channel-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const nome = document.getElementById("nome").value;
  const link = document.getElementById("link").value;
  const categoria = document.getElementById("categoria").value;
  const imagemUrl = document.getElementById("imagem-url").value;
  const imagemFile = document.getElementById("imagem-arquivo").files[0];

  let imagemFinal = imagemUrl;

  if (imagemFile) {
    const formData = new FormData();
    formData.append("file", imagemFile);
    const upload = await fetch(`${API_BASE_URL}/upload`, { method: "POST", body: formData });
    const result = await upload.json();
    imagemFinal = result.url;
  }

  await fetch(`${API_BASE_URL}/adicionar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nome, link, categoria, imagem: imagemFinal })
  });

  document.getElementById("add-channel-form").reset();
  document.getElementById("preview").classList.add("d-none");
  carregarCanais();
});

window.addEventListener("DOMContentLoaded", async () => {
  if (await isAdmin()) {
    document.getElementById("admin-panel").classList.remove("d-none");
    document.getElementById("admin-info").textContent = `Conectado como admin: ${username} (ID: ${userId})`;
  }
  carregarCanais();
});
