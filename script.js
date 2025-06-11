const SUPABASE_URL = "https://vcbiaornaidbskwzzvrs.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjYmlhb3JuYWlkYnNrd3p6dnJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2NjQ5OTksImV4cCI6MjA2NTI0MDk5OX0.Nc3a4WxmRmnAC13S9fw8KkaHi8dNn4qUwUAeO5fHv04";

// ✅ Correção aqui:
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Obtém dados do usuário via Telegram WebApp
const telegramUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
const userId = telegramUser?.id;

async function verificarAdmin(id) {
  const { data, error } = await supabase
    .from('admins')
    .select('*')
    .eq('id', Number(id));

  if (error) {
    alert("Erro ao verificar admin: " + error.message);
    console.error("Erro ao verificar admin:", error.message);
    return false;
  }

  console.log("Dados do admin:", data);
  return data && data.length > 0;
}

async function carregarCanais() {
  const { data, error } = await supabase
    .from("canais")
    .select("*")
    .order("id", { ascending: false });

  if (error) {
    console.error("Erro ao carregar canais:", error.message);
    return;
  }

  renderizarCatalogo(data);
}

// Renderiza os canais no catálogo
function renderizarCatalogo(canais) {
  const container = document.getElementById("catalogo");
  container.innerHTML = "";

  canais.forEach(canal => {
    const col = document.createElement("div");
    col.className = "col-md-4 mb-4";

    col.innerHTML = `
      <div class="card shadow-sm h-100">
        <img src="${canal.imagem}" class="card-img-top" alt="${canal.nome}">
        <div class="card-body d-flex flex-column">
          <h5 class="card-title">${canal.nome}</h5>
          <p class="card-text flex-grow-1">${canal.descricao}</p>
          <a href="${canal.url}" target="_blank" class="btn btn-primary mt-auto">🔗 Acessar Canal</a>
        </div>
      </div>
    `;
    container.appendChild(col);
  });
}

// Adiciona novo canal ao Supabase
async function adicionarCanal(event) {
  event.preventDefault();

  const canal = {
    nome: document.getElementById("nome").value,
    descricao: document.getElementById("descricao").value,
    url: document.getElementById("url").value,
    imagem: document.getElementById("imagem").value
  };

  const { error } = await supabase.from("canais").insert([canal]);

  if (error) {
    alert("Erro ao adicionar canal.");
    console.error(error);
  } else {
    document.getElementById("canalForm").reset();
    carregarCanais();
  }
}

// Inicializa tudo ao carregar
window.onload = async () => {
  if (window.Telegram?.WebApp) {
    Telegram.WebApp.expand();
  }
  console.log("User ID detectado:", userId);
  const admin = await verificarAdmin(userId);
  if (admin) {
    document.getElementById("adminPanel").classList.remove("d-none");
    document.getElementById("canalForm").addEventListener("submit", adicionarCanal);
  }

  carregarCanais();
};
