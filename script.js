const BACKEND_URL = "https://cat-logo-backend.onrender.com";

const tg = window.Telegram.WebApp;
tg.expand();

let usuarioTelegram = {};
let canais = [];

async function init() {
  try {
    console.log("🔍 tg.initDataUnsafe:", tg.initDataUnsafe);

    const initData = tg.initDataUnsafe?.user;
    if (!initData) throw new Error("Usuário do Telegram não identificado.");

    usuarioTelegram = {
      id: initData.id,
      username: initData.username,
      nome: initData.first_name + (initData.last_name ? " " + initData.last_name : "")
    };

    console.log("🙋‍♂️ Usuário identificado:", usuarioTelegram);

    const respostaAdmin = await fetch(`${BACKEND_URL}/verificar-admin/${usuarioTelegram.id}`);
    const { admin } = await respostaAdmin.json();

    if (admin) {
      document.getElementById("adminPanel").classList.remove("d-none");
      document.getElementById("formulario").addEventListener("submit", adicionarCanal);
      document.getElementById("adminInfo").innerText = `Conectado como admin: ${usuarioTelegram.username} (ID ${usuarioTelegram.id})`;
    }

    await carregarCanais();
  } catch (error) {
    console.error("❌ Erro ao iniciar app:", error);
    document.getElementById("catalogo").innerHTML = `
      <div class="text-center text-danger mt-4">
        Erro ao carregar o aplicativo.<br />
        Verifique se você está acessando através do Telegram WebApp.
      </div>
    `;
  } finally {
    document.getElementById("carregando").style.display = "none";
  }
}

async function carregarCanais() {
  const resposta = await fetch(`${BACKEND_URL}/listar-canais`);
  canais = await resposta.json();
  renderizarCatalogo(canais);
}

function renderizarCatalogo(lista) {
  const container = document.getElementById("catalogo");
  container.innerHTML = "";

  lista.forEach(canal => {
    const card = document.createElement("div");
    card.className = "col-md-4";

    card.innerHTML = `
      <div class="card h-100">
        ${canal.imagem ? `<img src="${canal.imagem}" class="card-img-top" alt="${canal.nome}" />` : ""}
        <div class="card-body d-flex flex-column">
          <h5 class="card-title">${canal.nome}</h5>
          <p class="card-text">${canal.descricao}</p>
          <a href="${canal.link}" class="btn btn-primary mt-auto" target="_blank">
            <i class="fa fa-arrow-right"></i> Acessar
          </a>
        </div>
      </div>
    `;

    container.appendChild(card);
  });
}

async function adicionarCanal(evento) {
  evento.preventDefault();

  const novoCanal = {
    nome: document.getElementById("nome").value,
    link: document.getElementById("link").value,
    descricao: document.getElementById("descricao").value,
    imagem: document.getElementById("imagem").value || null,
    admin_id: usuarioTelegram.id
  };

  const resposta = await fetch(`${BACKEND_URL}/adicionar-canal`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(novoCanal)
  });

  if (resposta.ok) {
    const canalCriado = await resposta.json();
    canais.push(canalCriado);
    renderizarCatalogo(canais);
    evento.target.reset();
  } else {
    alert("Erro ao adicionar canal.");
  }
}

window.addEventListener("DOMContentLoaded", init);
