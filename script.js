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
      ${c.imagem ? `<img src="${c.imagem}" class="image-preview">` : ""}
      <h5>${c.nome}</h5>
      <p>${c.descricao || "Sem descrição."}</p>
      <a href="${c.url}" target="_blank" class="btn btn-primary btn-sm">Acessar Canal</a>
      <div class="mt-2 admin-buttons"></div>`;
    container.appendChild(card);
    if (window.userIsAdmin) {
      const btns = card.querySelector(".admin-buttons");
      btns.innerHTML = `<button class="btn btn-warning btn-sm me-2">Editar</button>
                        <button class="btn btn-danger btn-sm">Excluir</button>`;
      btns.children[0].onclick = () => abrirEditor(c);
      btns.children[1].onclick = () => excluirCanal(c.id);
    }
  });
  document.getElementById("loading").style.display = "none";
}

function showDevPanel() {
  const panel = document.createElement("div");
  panel.innerHTML = `<div class="container mb-3">
    <h6>Painel Dev – Logs de Admin</h6><ul id="log-list" class="list-group"></ul></div>`;
  document.body.insertBefore(panel, document.getElementById("canal-lista"));

  fetch(`${API_BASE_URL}/admin_logs?user_id=${userId}`)
    .then(r => r.json())
    .then(logs => {
      const ul = document.getElementById("log-list");
      logs.forEach(l => {
        const dt = new Date(l.timestamp).toLocaleString();
        ul.innerHTML += `<li class="list-group-item">${dt} – Admin ${l.admin_id} ${l.action} canal ${l.target_id}</li>`;
      });
    }).catch(console.error);
}

window.addEventListener("DOMContentLoaded", async () => {
  window.userIsAdmin = await isAdmin();
  if (window.userIsAdmin) {
    document.getElementById("admin-panel").classList.remove("d-none");
    document.getElementById("admin-info").textContent = `${username} (ID: ${userId})`;
  }
  if (window.isDev) showDevPanel();

  document.getElementById("add-channel-form").addEventListener("submit", async e => {
    e.preventDefault();
    // ... mesmo código de envio/formatação ...
  });

  document.getElementById("edit-channel-form").addEventListener("submit", async e => {
    e.preventDefault();
    // ... mesmo código de edição ...
  });

  carregarCanais();
});
