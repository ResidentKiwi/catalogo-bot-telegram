const API_BASE_URL = "https://cat-logo-backend.onrender.com";
const DEV_ID = 5185766186;
const tg = window.Telegram?.WebApp;

if (!tg?.initDataUnsafe?.user) {
  document.body.innerHTML = `<div>Esta aplicação deve ser executada no Telegram.</div>`;
  throw new Error("Acesso negado");
}

Telegram.WebApp.ready();
const { id: userIdRaw, username } = tg.initDataUnsafe.user;
const userId = Number(userIdRaw);
let userIsAdmin = false;
const isDev = (userId === DEV_ID);
let canalEditando = null;

// Verifica se é admin
async function checkRoles() {
  const res = await fetch(`${API_BASE_URL}/admins`);
  const admins = await res.json();
  userIsAdmin = Array.isArray(admins) && admins.includes(userId);
}

// Carrega canais e mostra botões conforme permissão
async function carregarCanais() {
  const res = await fetch(`${API_BASE_URL}/canais`);
  const canais = await res.json();
  const container = document.getElementById("canal-lista");
  container.innerHTML = "";
  canais.forEach(c => {
    const canManage = userIsAdmin || isDev;
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      ${c.imagem ? `<img src="${c.imagem}" class="image-preview">` : ""}
      <h5>${c.nome}</h5>
      <p>${c.descricao || "Sem descrição."}</p>
      <a href="${c.url}" target="_blank" class="btn btn-primary btn-sm">Acessar Canal</a>
      ${canManage ? `
      <div class="mt-2 admin-buttons">
        <button class="btn btn-warning btn-sm me-2">Editar</button>
        <button class="btn btn-danger btn-sm">Excluir</button>
      </div>` : ""}
    `;
    container.appendChild(card);
    if (canManage) {
      card.querySelector(".btn-warning").onclick = () => abrirEditor(c);
      card.querySelector(".btn-danger").onclick = () => excluirCanal(c.id);
    }
  });
  document.getElementById("loading").style.display = "none";
}

// Mostra painel dev com logs e admins
async function showDevPanel() {
  const panel = document.createElement("div");
  panel.innerHTML = `
    <div class="container mb-4">
      <h5>Dev Panel</h5>
      <div class="row">
        <div class="col">
          <h6>Logs de Admin</h6>
          <ul id="log-list" class="list-group mb-3"></ul>
        </div>
        <div class="col">
          <h6>Admins</h6>
          <ul id="admin-list" class="list-group mb-2"></ul>
          <form id="add-admin-form" class="d-flex">
            <input id="new-admin-id" type="number" class="form-control me-2" placeholder="ID admin" required>
            <button type="submit" class="btn btn-success btn-sm">Adicionar</button>
          </form>
        </div>
      </div>
    </div>`;
  document.body.insertBefore(panel, document.getElementById("canal-lista"));

  const [logsRes, adminsRes] = await Promise.all([
    fetch(`${API_BASE_URL}/admin_logs?user_id=${userId}`),
    fetch(`${API_BASE_URL}/dev/admins?user_id=${userId}`)
  ]);
  const logs = await logsRes.json();
  const admins = await adminsRes.json();

  logs.forEach(l => {
    const dt = new Date(l.timestamp).toLocaleString();
    document.getElementById("log-list").innerHTML += `<li class="list-group-item">${dt} – Admin ${l.admin_id} ${l.action} canal ${l.target_id}</li>`;
  });
  admins.forEach(a => {
    const li = document.createElement("li");
    li.className = "list-group-item d-flex justify-content-between align-items-center";
    li.textContent = a;
    const btn = document.createElement("button");
    btn.className = "btn btn-sm btn-danger";
    btn.textContent = "Remover";
    btn.onclick = async () => {
      await fetch(`${API_BASE_URL}/dev/admins?del_id=${a}&user_id=${userId}`, { method: "DELETE" });
      li.remove();
    };
    li.appendChild(btn);
    document.getElementById("admin-list").appendChild(li);
  });

  document.getElementById("add-admin-form").onsubmit = async e => {
    e.preventDefault();
    const idNew = Number(document.getElementById("new-admin-id").value);
    await fetch(`${API_BASE_URL}/dev/admins?new_id=${idNew}&user_id=${userId}`, { method: "POST" });
    showDevPanel(); // refresh
  };
}

async function init() {
  await checkRoles();
  if (userIsAdmin || isDev) {
    document.getElementById("admin-panel").classList.remove("d-none");
    document.getElementById("admin-info").textContent = `${username} (ID: ${userId})`;
  }
  if (isDev) showDevPanel();
  carregarCanais();
}

init();
