const BACKEND_URL = "https://cat-logo-backend.onrender.com";

const tg = window.Telegram.WebApp;
tg.expand();

let usuarioTelegram = {};
let canais = [];

window.Telegram.WebApp.ready(); // Aguarda Telegram SDK

window.addEventListener("DOMContentLoaded", () => {
  // Pequeno atraso para garantir que initDataUnsafe esteja disponível
  setTimeout(init, 200);
});

async function init() {
  console.log("Iniciando WebApp com Telegram SDK...");

  try {
    let initData = tg.initDataUnsafe?.user;

    if (!initData) {
      console.warn("⚠️ Dados do Telegram não disponíveis. Ativando modo de teste local.");
      initData = {
        id: 123456789,
        username: "teste_admin",
        first_name: "Admin",
        last_name: "Local"
      };
    }

    usuarioTelegram = {
      id: initData.id,
      username: initData.username,
      nome: initData.first_name + (initData.last_name ? " " + initData.last_name : "")
    };

    const respostaAdmin = await fetch(`${BACKEND_URL}/verificar-admin/${usuarioTelegram.id}`);
    const { admin } = await respostaAdmin.json();

    if (admin) {
      document.getElementById("adminPanel").classList.remove("d-none");
      document.getElementById("adminInfo").innerText = `Conectado como admin: ${usuarioTelegram.username} (ID ${usuarioTelegram.id})`;
      document.getElementById("formulario").addEventListener("submit", adicionarCanal);
    }

    await carregarCanais();
  } catch (error) {
    console.error("Erro ao iniciar app:", error);
    document.getElementById("carregando").innerText = "Erro ao carregar dados.";
  }
}

async function carregarCanais() {
  const resposta = await fetch(`${BACKEND_URL}/listar-canais`);
  canais = await resposta.json();
  renderizarCatalogo(canais);
  document.getElementById("carregando").style.display = "none";
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
