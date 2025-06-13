const API_BASE_URL = "https://cat-logo-backend.onrender.com";
const tg = window.Telegram?.WebApp;

if (!tg?.initDataUnsafe?.user) {
  document.body.innerHTML = `<div class="container mt-5 text-center"><h3>Esta aplicação deve ser executada dentro do Telegram.</h3></div>`;
  throw new Error("Acesso negado fora do Telegram");
}
Telegram.WebApp.ready();
const { id: userId, username } = tg.initDataUnsafe.user;

async function isAdmin() {
  const res = await fetch(`${API_BASE_URL}/admins`);
  const admins = await res.json();
  return Array.isArray(admins) && admins.includes(userId);
}

async function carregarCanais() {
  const res = await fetch(`${API_BASE_URL}/canais`);
  const canais = await res.json();
  const container = document.getElementById("canal-lista");
  container.innerHTML = "";
  canais.forEach(c => {
    const card = document.createElement("div");
    card.className = "card p-3";
    card.innerHTML = `
      <h5>${c.nome}</h5>
      <a href="${c.url}" target="_blank" class="btn btn-primary btn-sm mb-2">
        <i class="fas fa-paper-plane"></i> Acessar Canal
      </a>
      ${c.imagem ? `<img src="${c.imagem}" class="image-preview mt-2" alt="Imagem do canal">` : ""}
      <div class="mt-2 admin-buttons"></div>
    `;
    container.appendChild(card);
    if (window.userIsAdmin) {
      const btns = card.querySelector(".admin-buttons");
      btns.innerHTML = `
        <button class="btn btn-warning btn-sm me-2"><i class="fas fa-edit"></i> Editar</button>
        <button class="btn btn-danger btn-sm"><i class="fas fa-trash"></i> Excluir</button>
      `;
      btns.children[0].onclick = () => editarCanal(c);
      btns.children[1].onclick = () => excluirCanal(c.id);
    }
  });
  document.getElementById("loading").style.display = "none";
}

function previewImage() {
  const file = document.getElementById("imagem-arquivo").files[0];
  const preview = document.getElementById("preview");
  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      preview.src = reader.result;
      preview.classList.remove("d-none");
    };
    reader.readAsDataURL(file);
  } else {
    preview.src=""; preview.classList.add("d-none");
  }
}

async function editarCanal(c) {
  const nome = prompt("Novo nome:", c.nome);
  const url = prompt("Nova URL:", c.url);
  if (!nome || !url) return;
  const imagem = prompt("Nova imagem (URL):", c.imagem || "");
  const body = { nome, url, imagem, user_id: userId };
  await fetch(`${API_BASE_URL}/canais/${c.id}`, { method: "PUT", headers: {"Content-Type": "application/json"}, body: JSON.stringify(body) });
  carregarCanais();
}

async function excluirCanal(canalId) {
  if (!confirm("Confirma exclusão?")) return;
  await fetch(`${API_BASE_URL}/canais/${canalId}?user_id=${userId}`, { method: "DELETE" });
  carregarCanais();
}

document.getElementById("imagem-arquivo").addEventListener("change", previewImage);

document.getElementById("add-channel-form").addEventListener("submit", async e => {
  e.preventDefault();
  let imagem = document.getElementById("imagem-url").value;
  const file = document.getElementById("imagem-arquivo").files[0];
  if (file) {
    const form = new FormData(); form.append("file", file);
    const res = await fetch(`${API_BASE_URL}/upload`, { method: "POST", body: form });
    imagem = (await res.json()).url;
  }
  const body = { nome: e.target.nome.value, url: e.target.link.value, imagem, user_id: userId };
  await fetch(`${API_BASE_URL}/canais`, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify(body)
  });
  e.target.reset(); document.getElementById("preview").classList.add("d-none");
  carregarCanais();
});

window.addEventListener("DOMContentLoaded", async () => {
  window.userIsAdmin = await isAdmin();
  if (window.userIsAdmin) {
    document.getElementById("admin-panel").classList.remove("d-none");
    document.getElementById("admin-info").textContent = `${username} (ID: ${userId})`;
  }
  carregarCanais();
});
