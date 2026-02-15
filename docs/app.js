(() => {
  const app = document.getElementById("app");
  if (!app) {
    document.body.innerHTML = "<pre>#app bulunamadı</pre>";
    return;
  }

  // GitHub Pages'te repo adı URL'nin ilk parçasıdır: /REPO_ADI/...
  const BASE = (() => {
    const parts = location.pathname.split("/").filter(Boolean);
    return parts.length ? `/${parts[0]}` : "";
  })();

  const VIEW = {
    public: {
      label: "Kamuya Açık",
      tabs: ["overview", "carbon", "performance", "circularity", "dynamic"],
    },
    professional: {
      label: "Profesyonel",
      tabs: ["overview", "carbon", "materials", "performance", "circularity", "dynamic"],
    },
    authority: {
      label: "Denetim Otoritesi",
      tabs: ["overview", "carbon", "materials", "performance", "circularity", "compliance", "dynamic"],
    },
  };

  const TABS = [
    { id: "overview", label: "Genel" , icon: "battery" },
    { id: "carbon", label: "Sürdürülebilirlik", icon: "leaf" },
    { id: "materials", label: "Malzeme", icon: "package" },
    { id: "performance", label: "Performans", icon: "zap" },
    { id: "circularity", label: "Döngüsel Ekonomi", icon: "recycle" },
    { id: "compliance", label: "Uyumluluk", icon: "shield" },
    { id: "dynamic", label: "Dinamik Veriler", icon: "activity" },
  ];

  const state = {
    view: "public",
    tab: "overview",
    data: null,
    err: null,
  };

  // --- DEFAULT (JSON okunamazsa bile ekranda bir şey görünsün) ---
  const DEFAULT = {
    passport: { id: "NMC-BAT-2025-FR-8105", version: "v1.0", status: "prototype", lastUpdate: "Veri mevcut değil" },
    battery: {
      manufacturer: "Veri mevcut değil",
      batteryType: "Çekiş bataryası (Traction Battery)",
      model: "Veri mevcut değil",
      chemistry: "NMC 811 (80% Ni, 10% Mn, 10% Co)",
      manufactureDate: "2025",
      manufactureCountry: "Fransa",
      productionSiteAddress: "Veri mevcut değil",
      capacity: "52 kWh",
      weight: "Veri mevcut değil",
    },
    carbonFootprint: {
      total: 77,
      unit: "kgCO₂e/kWh",
      reference: "Aulanier et al., 2023",
      stages: { rawMaterial: 35, manufacturing: 28, transport: 8, endOfLife: 6 },
      note: "Çekiş bataryası için literatür bazlı demo değer (prototip).",
    },
    materials: [
      { name: "Nikel (Ni)", percentage: 42, source: "Veri mevcut değil", recycledContent: "Veri mevcut değil" },
      { name: "Mangan (Mn)", percentage: 8, source: "Veri mevcut değil", recycledContent: "Veri mevcut değil" },
      { name: "Kobalt (Co)", percentage: 8, source: "Veri mevcut değil", recycledContent: "Veri mevcut değil" },
      { name: "Lityum (Li)", percentage: 7, source: "Veri mevcut değil", recycledContent: "Veri mevcut değil" },
      { name: "Grafit", percentage: 15, source: "Veri mevcut değil", recycledContent: "Veri mevcut değil" },
      { name: "Alüminyum", percentage: 12, source: "Veri mevcut değil", recycledContent: "Veri mevcut değil" },
      { name: "Diğer", percentage: 8, source: "Veri mevcut değil", recycledContent: "Veri mevcut değil" },
    ],
    performance: {
      energyDensity: "Veri mevcut değil",
      voltage: "Veri mevcut değil",
      power: "Veri mevcut değil",
      tempRange: "Veri mevcut değil",
      cycleLife: "Veri mevcut değil",
      efficiency: "Veri mevcut değil",
    },
    circularity: {
      repairability: "Veri mevcut değil",
      recyclability: "Veri mevcut değil",
      recycledContent: "Veri mevcut değil",
      secondLife: "Veri mevcut değil",
      docs: {
        dismantling: "Veri mevcut değil",
        sds: "Veri mevcut değil",
      },
    },
    compliance: {
      euBatteryRegulation: "Uyumlu (Demo)",
      espr: "Uyumlu (Demo)",
      rohs: "Uyumlu (Demo)",
      reach: "Uyumlu (Demo)",
      ce: "Uyumlu (Demo)",
      testReport: "Uyumlu (Demo)",
      productCertificates: "Uyumlu (Demo)",
    },
    dynamic: {
      performanceRecords: "Veri mevcut değil",
      soh: "Veri mevcut değil",
      soc: "Veri mevcut değil",
      batteryStatus: "Veri mevcut değil",
      usageData: "Veri mevcut değil",
      incidents: "Veri mevcut değil",
      temperatureExposure: "Veri mevcut değil",
    },
  };

  function escapeHtml(x) {
    return String(x ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function icon(name) {
    return `<i data-lucide="${name}" style="width:18px;height:18px;"></i>`;
  }

  function createIconsSafe() {
    try {
      if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
    } catch (_) {}
  }

  function isNoData(val) {
    const s = String(val ?? "").trim().toLowerCase();
    return !s || s === "veri mevcut değil" || s === "n/a" || s === "na" || s === "null";
  }

  function pillStatusClass(val) {
    // "Veri mevcut değil" ise WARN (yeşil olmasın)
    if (isNoData(val)) return "warn";
    // demo uyumluysa OK
    const s = String(val ?? "").toLowerCase();
    if (s.includes("uyumlu")) return "ok";
    return "warn";
  }

  function normalize(json) {
    if (!json) return structuredClone(DEFAULT);

    const out = structuredClone(DEFAULT);

    // passport
    if (json.passport) {
      out.passport.id = json.passport.id ?? out.passport.id;
      out.passport.version = json.passport.version ?? out.passport.version;
      out.passport.status = json.passport.status ?? out.passport.status;
      out.passport.lastUpdate = json.passport.lastUpdate ?? out.passport.lastUpdate;
    }

    // battery
    if (json.battery) {
      out.battery.manufacturer = json.battery.manufacturer ?? out.battery.manufacturer;
      out.battery.batteryType = json.battery.batteryType ?? out.battery.batteryType;
      out.battery.model = json.battery.model ?? out.battery.model;
      out.battery.chemistry = json.battery.chemistry ?? out.battery.chemistry;
      out.battery.manufactureDate = json.battery.manufactureDate ?? out.battery.manufactureDate;
      out.battery.manufactureCountry = json.battery.manufactureCountry ?? out.battery.manufactureCountry;
      out.battery.productionSiteAddress = json.battery.productionSiteAddress ?? out.battery.productionSiteAddress;
      out.battery.capacity = json.battery.capacity ?? out.battery.capacity;
      out.battery.weight = json.battery.weight ?? out.battery.weight;
    }

    // carbon
    if (json.carbonFootprint) {
      out.carbonFootprint.total = json.carbonFootprint.total ?? out.carbonFootprint.total;
      out.carbonFootprint.unit = json.carbonFootprint.unit ?? out.carbonFootprint.unit;
      out.carbonFootprint.reference = json.carbonFootprint.reference ?? out.carbonFootprint.reference;
      out.carbonFootprint.note = json.carbonFootprint.note ?? out.carbonFootprint.note;
      out.carbonFootprint.stages = json.carbonFootprint.stages ?? out.carbonFootprint.stages;
    }

    // materials
    if (Array.isArray(json.materials)) out.materials = json.materials;

    // performance
    if (json.performance) out.performance = { ...out.performance, ...json.performance };

    // circularity
    if (json.circularity) out.circularity = { ...out.circularity, ...json.circularity };

    // compliance
    if (json.compliance) out.compliance = { ...out.compliance, ...json.compliance };

    // dynamic
    if (json.dynamic) out.dynamic = { ...out.dynamic, ...json.dynamic };

    return out;
  }

  function allowedTabs() {
    return VIEW[state.view].tabs;
  }

  function ensureTabAllowed() {
    const allowed = allowedTabs();
    if (!allowed.includes(state.tab)) state.tab = allowed[0];
  }

  function kv(label, value) {
    return `
      <div class="kv">
        <div class="k">${escapeHtml(label)}</div>
        <div class="v">${escapeHtml(value ?? "Veri mevcut değil")}</div>
      </div>`;
  }

  function infoCard(title, value) {
    const cls = pillStatusClass(value);
    const iconName = cls === "ok" ? "check-circle" : cls === "bad" ? "x-circle" : "alert-circle";
    const pillText = isNoData(value) ? "Veri mevcut değil" : String(value);

    return `
      <div class="box">
        <div class="pill ${cls}">
          ${icon(iconName)}
          ${escapeHtml(title)}
        </div>
        <div style="font-size:18px;font-weight:900;">${escapeHtml(pillText)}</div>
      </div>`;
  }

  function renderOverview(d) {
    const b = d.battery;
    // İSTEDİĞİN: ekranı ikiye böl (modelden sonrası sağ taraf)
    return `
      <h2>Genel Bilgiler</h2>
      <div class="row">
        <div class="box">
          ${kv("Üretici", b.manufacturer)}
          ${kv("Batarya Türü", b.batteryType)}
          ${kv("Üretim Ülkesi", b.manufactureCountry)}
          ${kv("Üretim Yılı (Ay/Yıl)", b.manufactureDate)}
          ${kv("Üretim Yeri Adresi", b.productionSiteAddress)}
        </div>

        <div class="box">
          ${kv("Model", b.model)}
          ${kv("Pil Kimyası", b.chemistry)}
          ${kv("Nominal Kapasite", b.capacity)}
          ${kv("Ağırlık", b.weight)}
          <div class="small">Not: Bu sayfa tez için demo prototiptir.</div>
        </div>
      </div>
    `;
  }

  function renderCarbon(d) {
  var c = (d && d.carbonFootprint) ? d.carbonFootprint : {};

  var totalText = "Veri mevcut değil";
  if (c.total !== undefined && c.total !== null) {
    totalText = String(c.total) + (c.unit ? " " + String(c.unit) : "");
  }

  return (
    "<h2>Sürdürülebilirlik</h2>" +
    '<div class="row">' +
      '<div class="box">' +
        kv("Karbon Ayak İzi (Toplam)", totalText, "green") +
        kv("Sorumlu Tedarik Raporu", c.responsibleSourcingReport || "Veri mevcut değil", "blue") +
        kv("Geri Dönüştürülmüş İçerik Payı", c.recycledContentShare || "Veri mevcut değil", "amber") +
        kv("Yenilenebilir İçerik Payı", c.renewableContentShare || "Veri mevcut değil", "green") +
      "</div>" +
    "</div>"
  );
}

  function renderMaterials(d) {
    const list = (d.materials || []).map((m) => {
      const pct = Math.max(0, Math.min(100, Number(m.percentage || 0)));
      return `
        <div class="box">
          <div style="display:flex;justify-content:space-between;gap:10px;">
            <div style="font-weight:1000;">${escapeHtml(m.name)}</div>
            <div class="pill warn">${icon("package")} ${escapeHtml(pct)}%</div>
          </div>
          <div class="small">Kaynak: ${escapeHtml(m.source ?? "Veri mevcut değil")}</div>
          <div class="small">Geri dönüştürülmüş içerik: ${escapeHtml(m.recycledContent ?? "Veri mevcut değil")}</div>
          <div class="bar" style="margin-top:10px;"><div style="width:${pct}%"></div></div>
        </div>
      `;
    }).join("");

    return `
      <h2>Malzeme</h2>
      <div class="small" style="margin-bottom:10px;">
        Bu sekme Profesyonel ve Denetim Otoritesi için görünür (demo).
      </div>
      <div style="display:grid;gap:12px;">${list}</div>
    `;
  }

  function renderPerformance(d) {
    const p = d.performance;
    return `
      <h2>Performans</h2>
      <div class="grid3">
        <div class="box">${kv("Nominal Kapasite", d.battery.capacity)}</div>
        <div class="box">${kv("Voltaj (min/nom/max)", p.voltage)}</div>
        <div class="box">${kv("Güç Kapasitesi", p.power)}</div>
        <div class="box">${kv("Sıcaklık Aralığı", p.tempRange)}</div>
        <div class="box">${kv("Döngü Ömrü", p.cycleLife)}</div>
        <div class="box">${kv("Enerji Verimliliği", p.efficiency)}</div>
      </div>
    `;
  }

  function renderCircularity(d) {
    const c = d.circularity;

    return `
      <h2>Döngüsel Ekonomi</h2>
      <div class="row">
        <div class="box" style="background:transparent;border:none;padding:0;">
          <div style="display:grid;gap:12px;grid-template-columns:1fr;">
            ${infoCard("Onarılabilirlik Skoru", c.repairability)}
            ${infoCard("Geri Dönüşüm Bilgisi", c.recyclability)}  <!-- burada otomatik WARN olur -->
            ${infoCard("Geri Dönüştürülmüş İçerik", c.recycledContent)}
            ${infoCard("İkinci Ömür Uygunluğu", c.secondLife)}
          </div>
        </div>

        <div class="box">
          <h3 style="display:flex;gap:8px;align-items:center;margin-bottom:12px;">
            ${icon("file-text")} Mevcut Dokümanlar
          </h3>

          <div style="display:grid;gap:12px;">
            <div class="box">
              <div class="pill warn">${icon("check-circle")} Söküm Talimatları</div>
              <div style="font-size:18px;font-weight:900;">${escapeHtml(c.docs?.dismantling ?? "Veri mevcut değil")}</div>
            </div>
            <div class="box">
              <div class="pill warn">${icon("check-circle")} Güvenlik Veri Sayfası (SDS)</div>
              <div style="font-size:18px;font-weight:900;">${escapeHtml(c.docs?.sds ?? "Veri mevcut değil")}</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderCompliance(d) {
    const x = d.compliance;
    // İSTEDİĞİN: test/cert isimleri görünmesin -> sadece başlık + Uyumlu (Demo)
    const cards = [
      ["EU Battery Regulation", "2023/1542", x.euBatteryRegulation],
      ["ESPR", "Ecodesign Regulation", x.espr],
      ["RoHS", "", x.rohs],
      ["REACH", "", x.reach],
      ["CE", "", x.ce],
      ["Test Raporu", "", x.testReport],
      ["Ürün Sertifikaları", "", x.productCertificates],
    ].map(([title, sub, val]) => {
      const cls = pillStatusClass(val);
      const iconName = cls === "ok" ? "check-circle" : "alert-circle";
      return `
        <div class="box">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
            <div class="pill ${cls}">${icon(iconName)} ${escapeHtml(title)}</div>
          </div>
          ${sub ? `<div class="small">${escapeHtml(sub)}</div>` : `<div class="small">&nbsp;</div>`}
          <div style="font-size:18px;font-weight:1000;margin-top:6px;">${escapeHtml(isNoData(val) ? "Veri mevcut değil" : val)}</div>
        </div>`;
    }).join("");

    return `
      <h2>Uyumluluk</h2>
      <div class="grid3">${cards}</div>
    `;
  }

  function renderDynamic(d) {
    const dy = d.dynamic;
    return `
      <h2>Dinamik Veriler</h2>
      <div class="grid3">
        <div class="box">${kv("Performans Değerleri", dy.performanceRecords)}</div>
        <div class="box">${kv("Sağlık Durumu (SoH)", dy.soh)}</div>
        <div class="box">${kv("Şarj Durumu (SoC)", dy.soc)}</div>
        <div class="box">${kv('Pil Statüsü (orijinal / repurposed / yeniden kullanılan / yeniden üretilmiş / atık)', dy.batteryStatus)}</div>
        <div class="box">${kv("Kullanım Verileri", dy.usageData)}</div>
        <div class="box">${kv("Olumsuz Olaylar (Kazalar vb.)", dy.incidents)}</div>
        <div class="box">${kv("Sıcaklık Maruziyeti", dy.temperatureExposure)}</div>
      </div>
      <div class="small" style="margin-top:10px;">
        Not: Dinamik veriler demo amaçlıdır; gerçek kullanımda periyodik güncellenir.
      </div>
    `;
  }

  function render() {
    ensureTabAllowed();
    const d = state.data || structuredClone(DEFAULT);

    const viewButtons = Object.entries(VIEW).map(([id, v]) => {
      const active = state.view === id ? "active" : "";
      return `<button class="btn ${active}" data-view="${id}">${escapeHtml(v.label)}</button>`;
    }).join("");

    const allowed = allowedTabs();
    const tabsHtml = TABS
      .filter(t => allowed.includes(t.id))
      .map((t) => {
        const active = state.tab === t.id ? "active" : "";
        return `
          <div class="tab ${active}" data-tab="${t.id}">
            ${icon(t.icon)} ${escapeHtml(t.label)}
          </div>`;
      })
      .join("");

    let content = "";
    if (state.tab === "overview") content = renderOverview(d);
    else if (state.tab === "carbon") content = renderCarbon(d);
    else if (state.tab === "materials") content = renderMaterials(d);
    else if (state.tab === "performance") content = renderPerformance(d);
    else if (state.tab === "circularity") content = renderCircularity(d);
    else if (state.tab === "compliance") content = renderCompliance(d);
    else if (state.tab === "dynamic") content = renderDynamic(d);

    const header = `
      <div class="top">
        <div class="brand">
          <div class="logo">${icon("battery")}</div>
          <div>
            <h1>Dijital Batarya Pasaportu</h1>
            <div class="sub">Demo | YTÜ tez prototipi • ID: <b>${escapeHtml(d.passport.id)}</b></div>
          </div>
        </div>
        <div class="viewBtns">${viewButtons}</div>
      </div>

      <div class="tabs">${tabsHtml}</div>
    `;

    const errorBox = state.err
      ? `<div class="err">HATA: ${escapeHtml(state.err.message || String(state.err))}\nBASE: ${escapeHtml(BASE)}</div>`
      : "";

    app.innerHTML = header + `<div class="content">${content}</div>` + errorBox;

    // buton click
    app.querySelectorAll("[data-view]").forEach((b) => {
      b.onclick = () => {
        state.view = b.getAttribute("data-view");
        ensureTabAllowed();
        render();
        createIconsSafe();
      };
    });
    app.querySelectorAll("[data-tab]").forEach((t) => {
      t.onclick = () => {
        state.tab = t.getAttribute("data-tab");
        render();
        createIconsSafe();
      };
    });

    createIconsSafe();
  }

  async function init() {
    try {
      const url = `${BASE}/passport.json?ts=${Date.now()}`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`passport.json okunamadı (${res.status})`);
      const json = await res.json();
      state.data = normalize(json);
    } catch (e) {
      state.err = e;
      state.data = normalize(null);
    }
    render();
  }

  init();
})();
