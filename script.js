const API_BASE_URL = "https://cat-logo-backend.onrender.com";
const DEV_ID = 5185766186;
const tg = window.Telegram?.WebApp;

if (!tg?.initDataUnsafe?.user) {
  document.body.innerHTML = `<div>Esta aplicação deve ser executada dentro do Telegram.</div>`;
  throw new Error("Acesso negado fora do Telegram");
}

Telegram.WebApp.ready();
const { id: userIdRaw, username } = tg.initDataUnsafe.user;
const userId = Number(userIdRaw);
window.isDev = (userId === DEV_ID);
let window.userIsAdmin = false;
let canalEditando = null;

async function checkRoles() {
  const res = await fetch(`${API_BASE_URL}/admins`);
  const admins = await res.json();
  window.userIsAdmin = Array.isArray(admins) && admins.includes(userId);
}
async function carregarCanais() {
  const res = await fetch(`${API_BASE_URL}/canais`);
  const canais = await res.json();
  const container = document.getElementById("canal-lista");
  container.innerHTML = "";
  canais.forEach(c => {
    const card = document.createElement("div");
    card.className = "card";
    const canManage = window.userIsAdmin || window.isDev;
    card.innerHTML = `
      ${c.imagem ? `<img src="${c.imagem}" class="image-preview">` : ""}
      <h5>${c.nome}</h5>
      <p>${c.descricao || "Sem descrição."}</p>
      <a href="${c.url}" target="_blank" class="btn btn-primary btn-sm">Acessar Canal</a>
      ${canManage ? `<div class="mt-2 admin-buttons">
        <button class="btn btn-warning btn-sm me-2">Editar</button>
        <button class="btn btn-danger btn-sm">Excluir</button>
      </div>` : ""}
    `;
    container.appendChild(card);
    if (canManage) {
      const btns = card.querySelector(".admin-buttons");
      btns.children[0].onclick = () => abrirEditor(c);
      btns.children[1].onclick = () => excluirCanal(c.id);
    }
  });
  document.getElementById("loading").style.display = "none";
}

function showDevPanel() {
  const panel = document.createElement("div");
  panel.innerHTML = `<div class="container mb-3">
    <h5>Painel Dev – Logs e Admins</h5>
    <div class="row">
      <div class="col">
        <h6>Logs de admin</h6>
        <ul id="log-list" class="list-group mb-3"></ul>
      </div>
      <div class="col">
        <h6>Gerenciar Admins</h6>
        <ul id="admin-list" class="list-group mb-2"></ul>
        <form id="add-admin-form" class="d-flex">
          <input id="new-admin-id" type="number" class="form-control me-2" placeholder="ID admin" required>
          <button type="submit" class="btn btn-success btn-sm">Adicionar</button>
        </form>
      </div>
    </div>
  </div>`;
  document.body.insertBefore(panel, document.getElementById("canal-lista"));

  fetch(`${API_BASE_URL}/admin_logs?user_id=${userId}`)
    .then(r => r.json())
    .then(logs => {
      const ul = document.getElementById("log-list");
      logs.forEach(l => {
        const dt = new Date(l.timestamp).toLocaleString();
        ul.innerHTML += `<li class="list-group-item">${dt} – Admin ${l.admin_id} ${l.action} canal ${l.target_id}</li>`;
      });
    });

  fetch(`${API_BASE_URL}/admins`)
    .then(r => r.json())
    .then(admins => {
      const ul = document.getElementById("admin-list");
      admins.forEach(a => ul.innerHTML += `<li class="list-group-item">${a}</li>`);
    });

  document.getElementById("add-admin-form").onsubmit = async e => {
    e.preventDefault();
    const newId = Number(document.getElementById("new-admin-id").value);
    // 👉 Aqui você precisaria criar endpoint POST /admins, omitido
    alert(`Adicionar admin ${newId} ainda não implementado no backend`);
  };
}

window.addEventListener("DOMContentLoaded", async () => {
  await checkRoles();
  if (window.userIsAdmin || window.isDev) {
    document.getElementById("admin-panel").classList.remove("d-none");
    document.getElementById("admin-info").textContent = `${username} (ID: ${userId})`;
  }
  if (window.isDev) showDevPanel();
  // adicionar editores de formulários...
  carregarCanais();
});
