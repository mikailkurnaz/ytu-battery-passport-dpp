(() => {
  const state = {
    tab: "overview",
    showQR: false,
    data: null,
    error: null
  };

  const tabs = [
    { id: "overview", label: "Genel Bakış", icon: "battery" },
    { id: "carbon", label: "Karbon Ayak İzi", icon: "leaf" },
    { id: "materials", label: "Malzeme", icon: "package" },
    { id: "performance", label: "Performans", icon: "zap" },
    { id: "circularity", label: "Döngüsellik", icon: "recycle" },
    { id: "compliance", label: "Uyumluluk", icon: "shield" }
  ];

  const el = document.getElementById("app");

  function escapeHtml(x) {
    return String(x ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function icon(name) {
    return `<i data-lucide="${name}" style="width:18px;height:18px;"></i>`;
  }

  async function load() {
    state.error = null;
    try {
      const res = await fetch("./passport.json", { cache: "no-store" });
      if (!res.ok) throw new Error("passport.json okunamadı");
      state.data = await res.json();
    } catch (e) {
      state.error = e?.message || "Bilinmeyen hata";
      state.data = null;
    }
    render();
  }

  function headerHTML(d) {
    const id = d?.passport?.id || "—";
    const batteryType = d?.battery?.batteryType || "—";
    const chem = d?.battery?.chemistry?.code || d?.battery?.chemistry?.label || "—";
    const country = d?.battery?.manufacturing?.country || "—";

    return `
      <div class="card">
        <div class="header">
          <div class="brand">
            <div class="logo">${icon("battery")}</div>
            <div>
              <h1 class="title">Dijital Batarya Pasaportu</h1>
              <p class="subtitle">Tez Prototipi • EU Battery Regulation 2023/1542 & ESPR ile uyumlu tasarım</p>
            </div>
          </div>

          <button class="btn" data-action="toggleQR">
            ${icon("globe")} QR Kod
          </button>
        </div>

        ${state.showQR ? `
          <div class="qrBox">
            <div class="qrInner">
              <div class="qrFake">
                QR CODE<br/>
                ${escapeHtml(id)}
              </div>
            </div>
            <div class="small" style="margin-top:8px;">Bu QR kodu tarayarak pasaport sayfasına erişim (demo)</div>
          </div>
        ` : ""}

        <div class="grid4">
          <div class="mini">
            <div class="k">Pasaport ID</div>
            <div class="v" style="font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;">
              ${escapeHtml(id)}
            </div>
          </div>
          <div class="mini green">
            <div class="k">Batarya Türü</div>
            <div class="v">${escapeHtml(batteryType)}</div>
          </div>
          <div class="mini purple">
            <div class="k">Kimya</div>
            <div class="v">${escapeHtml(chem)}</div>
          </div>
          <div class="mini amber">
            <div class="k">Üretim Ülkesi</div>
            <div class="v">${escapeHtml(country)}</div>
          </div>
        </div>
      </div>
    `;
  }

  function tabsHTML() {
    return `
      <div class="tabs">
        ${tabs.map(t => `
          <button class="tab ${state.tab === t.id ? "active" : ""}" data-tab="${t.id}">
            ${icon(t.icon)} ${escapeHtml(t.label)}
          </button>
        `).join("")}
      </div>
    `;
  }

  function overviewHTML(d) {
    const b = d?.battery || {};
    const chem = b?.chemistry?.label || "—";
    const year = b?.manufacturing?.year || "—";
    const country = b?.manufacturing?.country || "—";
    const capacity = b?.capacity || "—";
    const manufacturer = b?.manufacturer || "—";
    const model = b?.model || "—";

    const cf = d?.carbonFootprint;
    const cfStatus = cf?.dataAvailable ? "Mevcut" : "Mevcut değil";

    return `
      <h2>Genel Bilgiler</h2>

      <div class="row">
        <div class="box">
          <div class="kv">
            <div class="k">Üretici</div>
            <div class="v">${escapeHtml(manufacturer)}</div>
          </div>
          <div class="kv green">
            <div class="k">Model</div>
            <div class="v">${escapeHtml(model)}</div>
          </div>
          <div class="kv purple">
            <div class="k">Kimya Yapısı</div>
            <div class="v">${escapeHtml(chem)}</div>
          </div>
          <div class="kv amber">
            <div class="k">Üretim</div>
            <div class="v">${escapeHtml(year)} • ${escapeHtml(country)}</div>
          </div>
          <div class="kv" style="border-left-color:#ec4899;">
            <div class="k">Nominal Kapasite</div>
            <div class="v">${escapeHtml(capacity)}</div>
          </div>
        </div>

        <div class="box" style="background:linear-gradient(135deg,#ecfdf5,#eff6ff); border-color:#dbeafe;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px;">
            <div>
              <div style="font-weight:1000; display:flex; gap:8px; align-items:center;">
                ${icon("check-circle")} Uyumluluk Durumu
              </div>
              <div class="muted" style="margin-top:6px;">
                Bu sayfa tez kapsamında hazırlanmış bir <b>demo</b> arayüzüdür.
              </div>
              <div style="margin-top:12px; display:flex; gap:8px; flex-wrap:wrap;">
                <span class="pill green">${icon("check-circle")} Uyumlu (Demo)</span>
                <span class="pill blue">${icon("shield")} Düzenleyici çerçeve</span>
              </div>
            </div>

            <div style="text-align:right;">
              <div class="small">Karbon ayak izi</div>
              <div style="font-weight:1000;">${escapeHtml(cfStatus)}</div>
              <div class="small" style="margin-top:6px;">
                <a href="./passport.json" target="_blank" rel="noopener">passport.json</a>
              </div>
            </div>
          </div>

          <div class="small" style="margin-top:14px;">
            Not: Eksik alanlar “Veri mevcut değil” olarak bırakılmıştır.
          </div>
        </div>
      </div>
    `;
  }

  function carbonHTML(d) {
    const cf = d?.carbonFootprint || {};
    const total = cf?.total ?? "—";
    const unit = cf?.unit || "kgCO₂e/kWh";
    const ref = cf?.reference || "—";
    const note = cf?.note || "";

    const stages = cf?.stages || {};
    const stageNames = {
      rawMaterial: "Hammadde Çıkarımı",
      manufacturing: "Üretim",
      transport: "Taşıma",
      endOfLife: "Ömür Sonu"
