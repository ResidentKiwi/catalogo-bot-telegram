const API_BASE_URL = "https://cat-logo-backend.onrender.com";
const tg = window.Telegram?.WebApp;

if (!tg?.initDataUnsafe?.user) {
  document.body.innerHTML = `<div class="container mt-5 text-center"><h3>Esta aplicação deve ser executada dentro do Telegram.</h3></div>`;
  throw new Error("Acesso negado fora do Telegram");
}
Telegram.WebApp.ready();
const { id: userId, username } = tg.initDataUnsafe.user;

let canalEditando = null;

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
    card.className = "card";

    card.innerHTML = `
      ${c.imagem ? `<img src="${c.imagem}" class="image-preview" alt="Imagem do canal">` : ""}
      <h5>${c.nome}</h5>
      <p>${c.descricao || "Sem descrição disponível."}</p>
      <a href="${c.url}" target="_blank" class="btn btn-primary btn-sm">
        <i class="fas fa-paper-plane"></i> Acessar Canal
      </a>
      <div class="mt-2 admin-buttons"></div>
    `;

    container.appendChild(card);

    if (window.userIsAdmin) {
      const btns = card.querySelector(".admin-buttons");
      btns.innerHTML = `
        <button class="btn btn-warning btn-sm me-2"><i class="fas fa-edit"></i> Editar</button>
        <button class="btn btn-danger btn-sm"><i class="fas fa-trash"></i> Excluir</button>
      `;
      btns.children[0].onclick = () => abrirEditor(c);
      btns.children[1].onclick = () => excluirCanal(c.id);
    }
  });
  document.getElementById("loading").style.display = "none";
}

function previewImage(inputId, previewId) {
  const file = document.getElementById(inputId).files[0];
  const preview = document.getElementById(previewId);
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

function abrirEditor(c) {
  canalEditando = c;
  document.getElementById("edit-form-container").classList.remove("d-none");
  document.getElementById("edit-nome").value = c.nome;
  document.getElementById("edit-link").value = c.url;
  document.getElementById("edit-imagem-url").value = c.imagem || "";
  document.getElementById("edit-descricao").value = c.descricao || "";
  const preview = document.getElementById("edit-preview");
  if (c.imagem) {
    preview.src = c.imagem;
    preview.classList.remove("d-none");
  } else {
    preview.src = "";
    preview.classList.add("d-none");
  }
}

async function excluirCanal(canalId) {
  if (!confirm("Confirma exclusão?")) return;
  await fetch(`${API_BASE_URL}/canais/${canalId}?user_id=${userId}`, {
    method: "DELETE"
  });
  carregarCanais();
}

document.getElementById("imagem-arquivo").addEventListener("change", () =>
  previewImage("imagem-arquivo", "preview")
);

document.getElementById("edit-imagem-arquivo").addEventListener("change", () =>
  previewImage("edit-imagem-arquivo", "edit-preview")
);

document.getElementById("add-channel-form").addEventListener("submit", async e => {
  e.preventDefault();

  const nome = document.getElementById("nome").value;
  const url = document.getElementById("link").value;
  const descricao = document.getElementById("descricao").value;
  let imagem = document.getElementById("imagem-url").value;
  const file = document.getElementById("imagem-arquivo").files[0];

  if (file) {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${API_BASE_URL}/upload`, { method: "POST", body: form });
    const result = await res.json();
    imagem = result.url;
  }

  const body = { nome, url, descricao, imagem, user_id: userId };
  await fetch(`${API_BASE_URL}/canais`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  e.target.reset();
  document.getElementById("preview").classList.add("d-none");
  carregarCanais();
});

document.getElementById("edit-channel-form").addEventListener("submit", async e => {
  e.preventDefault();
  if (!canalEditando) return;

  const nome = document.getElementById("edit-nome").value;
  const url = document.getElementById("edit-link").value;
  const descricao = document.getElementById("edit-descricao").value;
  let imagem = document.getElementById("edit-imagem-url").value;
  const file = document.getElementById("edit-imagem-arquivo").files[0];

  if (file) {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${API_BASE_URL}/upload`, { method: "POST", body: form });
    const result = await res.json();
    imagem = result.url;
  }

  const body = { nome, url, descricao, imagem, user_id: userId };

  await fetch(`${API_BASE_URL}/canais/${canalEditando.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  canalEditando = null;
  document.getElementById("edit-form-container").classList.add("d-none");
  e.target.reset();
  document.getElementById("edit-preview").classList.add("d-none");
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
