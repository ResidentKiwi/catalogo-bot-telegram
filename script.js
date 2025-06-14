const API_BASE_URL = "https://cat-logo-backend.onrender.com";
const tg = window.Telegram?.WebApp;

if (!tg?.initDataUnsafe?.user) {
  document.body.innerHTML = `<div class="container mt-5"><h3>Execute isso dentro do Telegram</h3></div>`;
  throw new Error("Acesso sem Telegram");
}
Telegram.WebApp.ready();

const { id: rawId, username } = tg.initDataUnsafe.user;
const userId = Number(rawId);
let isAdmin = false, isDev = false, canalEditando = null;

async function fetchRolesAndInitialize() {
  const [admins, devs] = await Promise.all([
    fetch(`${API_BASE_URL}/admins`).then(r => r.json()),
    fetch(`${API_BASE_URL}/devs`).then(r => r.json())
  ]);
  isAdmin = admins.includes(userId);
  isDev = devs.includes(userId);
  window.userIsAdmin = isAdmin;

  if (isAdmin) {
    document.getElementById("admin-panel").classList.remove("d-none");
    document.getElementById("admin-info").textContent = `${username} (ID: ${userId})`;
  }
  if (isDev) mountDevPanel();

  mountEventListeners(); // configura formulários
  carregarCanais();
}

async function carregarCanais() {
  const canais = await fetch(`${API_BASE_URL}/canais`).then(r => r.json());
  const container = document.getElementById("canal-lista");
  container.innerHTML = "";
  canais.forEach(c => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      ${c.imagem ? `<img src="${c.imagem}" class="image-preview">` : ""}
      <h5>${c.nome}</h5>
      <p>${c.descricao || "Sem descrição."}</p>
      <a href="${c.url}" target="_blank" class="btn btn-primary btn-sm">Acessar Canal</a>
      <div class="mt-2 admin-buttons"></div>`;
    container.appendChild(card);

    if (isAdmin) {
      const btns = card.querySelector(".admin-buttons");
      btns.innerHTML = `
        <button class="btn btn-warning btn-sm me-2">Editar</button>
        <button class="btn btn-danger btn-sm">Excluir</button>`;
      btns.children[0].onclick = () => abrirEditor(c);
      btns.children[1].onclick = () => excluirCanal(c.id);
    }
  });
  document.getElementById("loading").style.display = "none";
}

function mountEventListeners() {
  document.getElementById("imagem-arquivo")
    .addEventListener("change", () => previewImage("imagem-arquivo", "preview"));
  document.getElementById("edit-imagem-arquivo")
    .addEventListener("change", () => previewImage("edit-imagem-arquivo", "edit-preview"));

  document.getElementById("add-channel-form").addEventListener("submit", async e => {
    e.preventDefault();
    let imagem = document.getElementById("imagem-url").value;
    const file = document.getElementById("imagem-arquivo").files[0];
    if (file) {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${API_BASE_URL}/upload`, { method: "POST", body: form });
      const { url } = await res.json();
      imagem = url;
    }
    const body = {
      nome: document.getElementById("nome").value,
      url: document.getElementById("link").value,
      descricao: document.getElementById("descricao").value,
      imagem,
      user_id: userId
    };
    await fetch(`${API_BASE_URL}/canais`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    e.target.reset();
    carregarCanais();
  });

  document.getElementById("edit-channel-form").addEventListener("submit", async e => {
    e.preventDefault();
    if (!canalEditando) return;
    let imagem = document.getElementById("edit-imagem-url").value;
    const file = document.getElementById("edit-imagem-arquivo").files[0];
    if (file) {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${API_BASE_URL}/upload`, { method: "POST", body: form });
      const { url } = await res.json();
      imagem = url;
    }
    await fetch(`${API_BASE_URL}/canais/${canalEditando.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: document.getElementById("edit-nome").value,
        url: document.getElementById("edit-link").value,
        descricao: document.getElementById("edit-descricao").value,
        imagem,
        user_id: userId
      })
    });
    canalEditando = null;
    document.getElementById("edit-form-container").classList.add("d-none");
    carregarCanais();
  });
}

function abrirEditor(c) {
  canalEditando = c;
  document.getElementById("edit-form-container").classList.remove("d-none");
  document.getElementById("edit-nome").value = c.nome;
  document.getElementById("edit-link").value = c.url;
  document.getElementById("edit-descricao").value = c.descricao;
  document.getElementById("edit-imagem-url").value = c.imagem;
  const preview = document.getElementById("edit-preview");
  preview.src = c.imagem || "";
  preview.classList.toggle("d-none", !c.imagem);
}

async function excluirCanal(id) {
  if (!confirm("Confirma exclusão?")) return;
  await fetch(`${API_BASE_URL}/canais/${id}?user_id=${userId}`, { method: "DELETE" });
  carregarCanais();
}

function previewImage(inputId, previewId) {
  const file = document.getElementById(inputId).files[0];
  const preview = document.getElementById(previewId);
  if (file) {
    new FileReader().onload = e => {
      preview.src = e.target.result;
      preview.classList.remove("d-none");
    };
    new FileReader().readAsDataURL(file);
  } else {
    preview.classList.add("d-none");
  }
}

function mountDevPanel() {
  const panel = document.createElement("div");
  panel.className = "container mb-4";
  panel.innerHTML = `
    <div class="card p-4">
      <h6>Painel Dev</h6>
      <div>
        <strong>Admins Atuais:</strong>
        <ul id="dev-admin-list" class="list-group mb-3"></ul>
        <form id="add-admin-form" class="d-flex mb-3">
          <input id="novo-admin" type="number" class="form-control me-2" placeholder="ID do Admin" required>
          <button class="btn btn-success btn-sm">Adicionar</button>
        </form>
      </div>
      <div>
        <strong>Logs:</strong>
        <ul id="log-list" class="list-group"></ul>
      </div>
    </div>`;
  document.body.insertBefore(panel, document.getElementById("admin-panel"));

  fetch(`${API_BASE_URL}/admins`).then(r => r.json()).then(list => {
    const ul = document.getElementById("dev-admin-list");
    list.forEach(id => {
      const li = document.createElement("li");
      li.className = "list-group-item d-flex justify-content-between align-items-center";
      li.innerHTML = `ID ${id}<button class="btn btn-sm btn-danger">Remover</button>`;
      li.querySelector("button").onclick = async () => {
        await fetch(`${API_BASE_URL}/admins?user_id=${userId}&remove_admin=${id}`, { method: "DELETE" });
        li.remove();
      };
      ul.appendChild(li);
    });
  });

  document.getElementById("add-admin-form").addEventListener("submit", async e => {
    e.preventDefault();
    const novoId = Number(document.getElementById("novo-admin").value);
    await fetch(`${API_BASE_URL}/admins`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, novo_admin: novoId })
    });
    location.reload(); // recarrega lista
  });

  fetch(`${API_BASE_URL}/admin_logs?user_id=${userId}`)
    .then(r => r.json())
    .then(logs => {
      const ul = document.getElementById("log-list");
      logs.forEach(l => ul.innerHTML += `
        <li class="list-group-item">${new Date(l.timestamp).toLocaleString()} – Admin ${l.admin_id} ${l.action} canal ${l.target_id}</li>`);
    });
}

window.addEventListener("DOMContentLoaded", fetchRolesAndInitialize);
