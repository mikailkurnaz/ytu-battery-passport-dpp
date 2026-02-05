const TABS = [
  { id: "overview", label: "Genel Bakış", icon: "battery" },
  { id: "carbon", label: "Karbon Ayak İzi", icon: "leaf" },
  { id: "materials", label: "Malzeme", icon: "package" },
  { id: "performance", label: "Performans", icon: "zap" },
  { id: "circularity", label: "Döngüsellik", icon: "recycle" },
  { id: "compliance", label: "Uyumluluk", icon: "shield" },
  { id: "machine", label: "Makine Okunur", icon: "file-text" }
];

let activeTab = "overview";
let data = null;

const elTabs = document.getElementById("tabs");
const elContent = document.getElementById("content");
const elTopCards = document.getElementById("topCards");
const elFooter = document.getElementById("footer");

const elQrBtn = document.getElementById("qrBtn");
const elQrArea = document.getElementById("qrArea");

init();

async function init() {
  // Tabs render
  elTabs.innerHTML = TABS.map(t => `
    <button class="tab ${t.id === activeTab ? "active" : ""}" data-tab="${t.id}">
      <i data-lucide="${t.icon}"></i>
      <span>${escapeHtml(t.label)}</span>
    </button>
  `).join("");

  elTabs.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-tab]");
    if (!btn) return;
    activeTab = btn.dataset.tab;
    render();
  });

  // Load JSON
  try {
    const res = await fetch("./passport.json", { cache: "no-store" });
    if (!res.ok) throw new Error("passport.json bulunamadı (HTTP " + res.status + ")");
    data = await res.json();
  } catch (err) {
    elContent.innerHTML = `<div class="warn"><b>Hata:</b> ${escapeHtml(String(err))}</div>`;
    safeIcons();
    return;
  }

  // QR toggle
  elQrBtn.addEventListener("click", () => {
    const isOpen = elQrArea.style.display === "block";
    elQrArea.style.display = isOpen ? "none" : "block";
    if (!isOpen) drawQR();
  });

  render();
}

function render() {
  // Update tab styles
  [...document.querySelectorAll(".tab")].forEach(btn => {
    btn.classList.toggle("active", btn.dataset.tab === activeTab);
  });

  renderTopCards();
  elContent.innerHTML = renderTab(activeTab);
  renderFooter();

  safeIcons();
}

function renderTopCards() {
  const id = data?.passport?.id ?? "—";
  const type = data?.battery?.batteryType ?? "—";
  const chem = data?.battery?.chemistry?.label ?? "—";
  const country = data?.battery?.manufacturing?.countryName ?? data?.battery?.manufacturing?.country ?? "—";

  elTopCards.innerHTML = `
    ${miniCard("Pasaport ID", `<span class="mono">${escapeHtml(id)}</span>`, "blue")}
    ${miniCard("Batarya Türü", escapeHtml(type), "green")}
    ${miniCard("Kimya", escapeHtml(chem), "purple")}
    ${miniCard("Üretim Ülkesi", escapeHtml(country), "orange")}
  `;
}

function miniCard(k, v) {
  return `
    <div class="mini">
      <div class="k">${k}</div>
      <div class="v">${v}</div>
    </div>
  `;
}

function renderTab(tab) {
  if (tab === "overview") return overviewHTML();
  if (tab === "carbon") return carbonHTML();
  if (tab === "materials") return materialsHTML();
  if (tab === "performance") return performanceHTML();
  if (tab === "circularity") return circularityHTML();
  if (tab === "compliance") return complianceHTML();
  if (tab === "machine") return machineHTML();
  return `<div>—</div>`;
}

/* ---------- Tabs content ---------- */

function overviewHTML() {
  const b = data.battery || {};
  const p = data.passport || {};

  const missing = (v) => (v === null || v === "" || v === undefined);
  const m = (v) => missing(v) ? "Veri mevcut değil" : escapeHtml(String(v));

  const status = p.status === "production" ? "Production" : "Prototype / Demo";

  return `
    <h2 class="title2">Genel Bilgiler</h2>
    <div class="two">
      <div>
        ${line("Üretici", m(b.manufacturer), "blue")}
        ${line("Kimya Yapısı", m(b.chemistry?.description), "green")}
        ${line("Üretim Yılı", m(b.manufacturing?.year), "purple")}
        ${line("Üretim Ülkesi", m(b.manufacturing?.countryName || b.manufacturing?.country), "orange")}
        ${line("Nominal Kapasite", m(formatCapacity(b.capacity)), "amber")}
      </div>

      <div>
        <div class="boxSoft">
          <div style="display:flex; gap:10px; align-items:center; font-weight:900;">
            <i data-lucide="check-circle"></i>
            Uyumluluk Durumu
          </div>
          <ul class="listDot">
            ${(data.compliance?.highLevel || []).map(x => `
              <li><span class="dot"></span>${escapeHtml(x)}</li>
            `).join("")}
          </ul>
          <div class="small" style="margin-top:10px;">
            <b>Pasaport Durumu:</b> ${escapeHtml(status)}
          </div>
        </div>

        <div class="warn" style="margin-top:12px;">
          <div style="display:flex; gap:10px; align-items:center; font-weight:900;">
            <i data-lucide="alert-circle"></i>
            Veri Durumu (Prototip)
          </div>

          ${okRow("Karbon ayak izi", !!data.carbonFootprint?.total)}
          ${okRow("Söküm / geri dönüşüm", !!data.circularity?.dismantlingInfo)}
          ${warnRow("Geri dönüştürülmüş içerik", !!data.circularity?.recycledContent)}
          ${warnRow("İkinci ömür uygunluğu", !!data.circularity?.secondLife)}
          ${warnRow("Pasaport güncelleme tarihi", !!data.passport?.lastUpdate)}

          <div class="small" style="margin-top:10px;">
            * Tez prototipi: “Veri mevcut değil” alanları gerçek üretim verisi ile güncellenecektir.
          </div>
        </div>
      </div>
    </div>
  `;
}

function carbonHTML() {
  const cf = data.carbonFootprint || {};
  const total = cf.total?.value ?? null;
  const unit = cf.total?.unit ?? "—";
  const ref = cf.reference?.citation ?? "—";
  const note = cf.reference?.note ?? "";

  const stages = cf.stages || {};
  const stageNames = {
    rawMaterial: "Hammadde Çıkarımı",
    manufacturing: "Üretim",
    transport: "Taşıma",
    endOfLife: "Ömür Sonu"
  };

  const stageRows = Object.entries(stages).map(([k, v]) => {
    const pct = total ? ((v / total) * 100) : 0;
    return progressRow(stageNames[k] || k, v, unit, pct);
  }).join("");

  return `
    <div style="display:flex; justify-content:space-between; gap:14px; flex-wrap:wrap; align-items:flex-end;">
      <h2 class="title2" style="margin-bottom:0;">Karbon Ayak İzi</h2>
      <div style="text-align:right;">
        <div style="font-size:26px; font-weight:1000; color:var(--green);">
          ${total ?? "—"} ${escapeHtml(unit)}
        </div>
        <div class="small">Çekiş bataryası için</div>
        <div class="small">Kaynak: ${escapeHtml(ref)}</div>
      </div>
    </div>

    <div class="warn" style="margin-top:14px;">
      <div style="display:flex; gap:10px; align-items:center; font-weight:900;">
        <i data-lucide="alert-circle"></i> Önemli Not
      </div>
      <div class="small" style="margin-top:8px;">
        ${escapeHtml(note)} (Tez prototipi – gerçek üretim verisi ile farklılık gösterebilir.)
      </div>
    </div>

    <div class="two" style="margin-top:14px;">
      <div>
        <div style="font-weight:900; margin-bottom:8px;">Tahmini Yaşam Döngüsü Dağılımı</div>
        ${stageRows || `<div class="small">Aşama verisi yok.</div>`}
      </div>

      <div class="boxSoft">
        <div style="font-weight:900; margin-bottom:10px;">Hesaplama Metodolojisi</div>
        <div class="ok"><i data-lucide="file-text"></i> <span><b>Standart:</b> ${escapeHtml(cf.method?.standard || "ISO 14067:2018")}</span></div>
        <div class="ok"><i data-lucide="leaf"></i> <span><b>Kapsam:</b> ${escapeHtml(cf.method?.scope || "Cradle-to-gate")}</span></div>
        <div class="ok"><i data-lucide="trending-up"></i> <span><b>Veri tipi:</b> ${escapeHtml(cf.method?.dataQuality || "Literatür bazlı tahmin")}</span></div>

        <div style="margin-top:10px; padding:10px; background:#fff; border-radius:12px;">
          <div class="small">Veri Kalitesi</div>
          <div style="font-weight:900;">${escapeHtml(cf.method?.qualityLabel || "Literatür bazlı tahmin")}</div>
          <div class="small">${escapeHtml(cf.method?.qualityNote || "Gerçek üretim verisi mevcut değil")}</div>
        </div>
      </div>
    </div>
  `;
}

function materialsHTML() {
  const mats = data.materials || [];

  return `
    <h2 class="title2">Malzeme Kompozisyonu & Tedarik</h2>

    <div class="warn">
      <div style="display:flex; gap:10px; align-items:center; font-weight:900;">
        <i data-lucide="alert-circle"></i> Veri Durumu
      </div>
      <div class="small" style="margin-top:8px;">
        Tedarik kaynağı ve geri dönüştürülmüş içerik verileri prototip aşamasında “Veri mevcut değil” olabilir.
        Yüzdeler NMC 811 için tipik değerleri temsil eder.
      </div>
    </div>

    <div style="margin-top:14px; display:grid; gap:12px;">
      ${mats.map(mat => materialCard(mat)).join("")}
    </div>

    <div class="boxSoft" style="margin-top:14px;">
      <div style="display:flex; gap:10px; align-items:center; font-weight:900;">
        <i data-lucide="shield"></i> Due Diligence & Sorumlu Tedarik
      </div>
      <div class="two" style="margin-top:10px;">
        ${(data.dueDiligence?.items || []).map(x => `
          <div style="background:#fff; padding:12px; border-radius:12px; border:1px solid #e5e7eb;">
            <div style="font-weight:900;">${escapeHtml(x.title)}</div>
            <div class="small" style="margin-top:4px;">${escapeHtml(x.status)}</div>
          </div>
        `).join("")}
      </div>
      <div class="small" style="margin-top:10px;">
        * Tez prototipi: Due diligence verileri seri üretimde güncellenecektir.
      </div>
    </div>
  `;
}

function performanceHTML() {
  const perf = data.performance || {};

  const labels = {
    energyDensity: "Enerji Yoğunluğu",
    powerDensity: "Güç Yoğunluğu",
    cycleLife: "Çevrim Ömrü",
    chargingTime: "Şarj Süresi",
    operatingTemp: "Çalışma Sıcaklığı",
    stateOfHealth: "Sağlık Durumu (SoH)"
  };

  const cards = Object.keys(labels).map(k => {
    const v = perf[k] ?? null;
    return `
      <div style="background:linear-gradient(135deg,#f9fafb,#eff6ff); border:1px solid #e5e7eb; border-radius:16px; padding:14px;">
        <div class="small">${labels[k]}</div>
        <div style="font-size:18px; font-weight:1000; margin-top:6px;">
          ${escapeHtml(v === null ? "Veri mevcut değil" : String(v))}
        </div>
      </div>
    `;
  }).join("");

  const tests = data.tests || { safety: [], performance: [] };

  return `
    <h2 class="title2">Teknik Performans Verileri</h2>

    <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
      ${cards}
    </div>

    <div class="boxSoft" style="margin-top:14px; border:1px solid #bbf7d0;">
      <div style="font-weight:900; margin-bottom:10px;">Batarya Test Sonuçları (Demo)</div>
      <div class="two">
        <div>
          <div style="font-weight:900; margin-bottom:8px;">Güvenlik Testleri</div>
          ${(tests.safety || []).map(t => `<div class="small">✓ ${escapeHtml(t)}</div>`).join("")}
        </div>
        <div>
          <div style="font-weight:900; margin-bottom:8px;">Performans Testleri</div>
          ${(tests.performance || []).map(t => `<div class="small">✓ ${escapeHtml(t)}</div>`).join("")}
        </div>
      </div>
      <div class="small" style="margin-top:10px;">
        * Tez prototipi: Test listesi örnektir; gerçek raporlarla güncellenecektir.
      </div>
    </div>
  `;
}

function circularityHTML() {
  const c = data.circularity || {};
  return `
    <h2 class="title2">Döngüsel Ekonomi & Sürdürülebilirlik</h2>

    <div class="two">
      <div style="display:grid; gap:12px;">
        ${metricBox("Onarılabilirlik Skoru", c.repairability, "amber", "ESPR Repairability Index değerlendirmesi yapılacak")}
        ${metricBox("Geri Dönüşüm Bilgisi", c.recyclability, "green", "Söküm talimatları ve geri dönüşüm prosedürleri mevcuttur")}
        ${metricBox("Geri Dönüştürülmüş İçerik", c.recycledContent, "amber", "Üretimde kullanılan geri dönüştürülmüş malzeme oranı prototip aşamasında")}
        ${metricBox("İkinci Ömür Uygunluğu", c.secondLife, "amber", "Yeniden kullanım senaryoları değerlendirme aşamasında")}
      </div>

      <div style="display:grid; gap:12px;">
        <div class="boxSoft" style="border:1px solid #bbf7d0;">
          <div style="display:flex; gap:10px; align-items:center; font-weight:900;">
            <i data-lucide="file-text"></i> Mevcut Dokümanlar
          </div>
          ${(c.documents || []).map(d => `
            <div style="margin-top:10px; background:#fff; border:1px solid #e5e7eb; border-radius:14px; padding:12px; display:flex; gap:10px;">
              <i data-lucide="check-circle"></i>
              <div>
                <div style="font-weight:900;">${escapeHtml(d.title)}</div>
                <div class="small">${escapeHtml(d.note)}</div>
              </div>
            </div>
          `).join("")}
        </div>

        <div class="warn">
          <div style="display:flex; gap:10px; align-items:center; font-weight:900;">
            <i data-lucide="alert-circle"></i> Geliştirilecek Alanlar
          </div>
          ${(c.toImprove || []).map(x => `
            <div style="margin-top:10px; background:#fff; border:1px solid #fde68a; border-radius:14px; padding:12px; display:flex; gap:10px;">
              <i data-lucide="alert-circle"></i>
              <div>
                <div style="font-weight:900;">${escapeHtml(x.title)}</div>
                <div class="small">${escapeHtml(x.note)}</div>
              </div>
            </div>
          `).join("")}
          <div class="small" style="margin-top:10px;">
            Not: Tez prototipinde veriler kısmen mevcuttur; seri üretimde tüm alanlar güncellenecektir.
          </div>
        </div>
      </div>
    </div>
  `;
}

function complianceHTML() {
  const comp = data.compliance || {};
  const regs = comp.regulations || [];

  return `
    <h2 class="title2">Düzenleyici Uyumluluk</h2>

    <div class="two">
      ${regs.map(r => regulationCard(r)).join("")}
    </div>

    <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top:14px;">
      ${(comp.quickChecks || []).map(x => `
        <div style="background:#f9fafb; border:1px solid #e5e7eb; border-radius:14px; padding:12px;">
          <div style="font-weight:1000; font-size:13px;">${escapeHtml(x.title)}</div>
          <div class="small">${escapeHtml(x.note)}</div>
          <div class="ok" style="margin-top:8px;">
            <i data-lucide="check-circle"></i>
            <span class="tagOk">${escapeHtml(x.status)}</span>
          </div>
        </div>
      `).join("")}
    </div>

    <div class="boxSoft" style="margin-top:14px; background:#faf5ff; border:1px solid #e9d5ff;">
      <div style="font-weight:900; margin-bottom:10px;">Sertifikalar & Denetimler (Demo)</div>
      <div class="two">
        <div>
          <div style="font-weight:900; margin-bottom:8px;">Ürün Sertifikaları</div>
          ${(comp.certificates || []).map(x => `<div class="small">• ${escapeHtml(x)}</div>`).join("")}
        </div>
        <div>
          <div style="font-weight:900; margin-bottom:8px;">Tedarik Zinciri</div>
          ${(comp.supplyChain || []).map(x => `<div class="small">• ${escapeHtml(x)}</div>`).join("")}
        </div>
      </div>
    </div>
  `;
}

function machineHTML() {
  const raw = JSON.stringify(data, null, 2);
  return `
    <h2 class="title2">Makine Okunur Çıktı</h2>

    <div class="warn">
      <div style="display:flex; gap:10px; align-items:center; font-weight:900;">
        <i data-lucide="alert-circle"></i>
        Not
      </div>
      <div class="small" style="margin-top:8px;">
        Bu bölüm tez kapsamında “tek QR → tek erişim noktası” yaklaşımını desteklemek için ham JSON’u gösterir.
        Dosyalar: <a href="./passport.json" target="_blank">passport.json</a> ve
        <a href="./schema.json" target="_blank">schema.json</a>.
      </div>
    </div>

    <div style="margin-top:14px;">
      <pre>${escapeHtml(raw)}</pre>
    </div>
  `;
}

/* ---------- Helpers ---------- */

function line(k, v, color) {
  const cls = color ? `line ${color}` : "line";
  return `
    <div class="${cls}">
      <div class="k">${escapeHtml(k)}</div>
      <div class="v">${v}</div>
    </div>
  `;
}

function okRow(label, present) {
  return `
    <div class="ok">
      <i data-lucide="check-circle"></i>
      <span>${escapeHtml(label)}: <span class="tagOk">${present ? "Mevcut" : "Mevcut değil"}</span></span>
    </div>
  `;
}
function warnRow(label, present) {
  return `
    <div class="ok">
      <i data-lucide="alert-circle"></i>
      <span>${escapeHtml(label)}: <span class="tagWarn">${present ? "Mevcut" : "Mevcut değil"}</span></span>
    </div>
  `;
}

function progressRow(name, value, unit, pct) {
  const p = Math.max(0, Math.min(100, pct || 0));
  return `
    <div class="pRow">
      <div class="pTop">
        <div style="font-weight:900;">${escapeHtml(name)}</div>
        <div style="font-weight:900;">${escapeHtml(String(value))} ${escapeHtml(unit)} (${p.toFixed(1)}%)</div>
      </div>
      <div class="bar"><div class="fill" style="width:${p}%"></div></div>
    </div>
  `;
}

function materialCard(mat) {
  const pct = mat.percentage ?? 0;
  const rec = !!mat.recyclable;

  return `
    <div class="matCard">
      <div class="matHead">
        <div style="display:flex; gap:12px;">
          <div class="badgePct">${escapeHtml(String(pct))}%</div>
          <div>
            <div style="font-weight:1000;">${escapeHtml(mat.name || "—")}</div>
            <div class="small">Kaynak: ${escapeHtml(mat.source || "Veri mevcut değil")}</div>
            <div class="small">Geri dönüştürülmüş içerik: ${escapeHtml(mat.recycledContent || "Veri mevcut değil")}</div>
          </div>
        </div>

        <div class="pill ${rec ? "green" : "gray"}">
          <i data-lucide="${rec ? "recycle" : "alert-circle"}"></i>
          ${rec ? "Geri Dönüştürülebilir" : "Sınırlı Geri Dönüşüm"}
        </div>
      </div>

      <div class="bar" style="height:8px; margin-top:12px;">
        <div class="fill" style="height:8px; width:${Math.max(0, Math.min(100, pct))}%"></div>
      </div>
    </div>
  `;
}

function metricBox(title, value, color, note) {
  const missing = (v) => (v === null || v === "" || v === undefined);
  const v = missing(value) ? "Veri mevcut değil" : String(value);

  const border = color === "green" ? "#86efac" : "#fde68a";
  const bg = color === "green" ? "linear-gradient(135deg,#ecfdf5,#dcfce7)" : "linear-gradient(135deg,#fffbeb,#fef3c7)";
  const icon = color === "green" ? "check-circle" : "alert-circle";

  return `
    <div style="border:2px solid ${border}; background:${bg}; border-radius:16px; padding:14px;">
      <div style="display:flex; justify-content:space-between; gap:10px; align-items:center;">
        <div style="font-weight:1000;">${escapeHtml(title)}</div>
        <i data-lucide="${icon}"></i>
      </div>
      <div style="margin-top:10px; font-weight:900;">${escapeHtml(v)}</div>
      <div class="small" style="margin-top:6px;">${escapeHtml(note || "")}</div>
    </div>
  `;
}

function regulationCard(r) {
  return `
    <div class="boxSoft" style="border:1px solid #bbf7d0;">
      <div style="display:flex; gap:10px; align-items:center; font-weight:1000; margin-bottom:8px;">
        <div style="background:${r.color || "#22c55e"}; width:38px; height:38px; border-radius:12px; display:flex; align-items:center; justify-content:center; color:white;">
          <i data-lucide="${r.icon || "shield"}"></i>
        </div>
        <div>
          <div style="font-weight:1000;">${escapeHtml(r.title || "—")}</div>
          <div class="small">${escapeHtml(r.subtitle || "")}</div>
        </div>
      </div>

      <div style="margin-top:10px;">
        ${(r.items || []).map(x => `
          <div class="ok">
            <i data-lucide="check-circle"></i>
            <span>${escapeHtml(x)}</span>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

function formatCapacity(cap) {
  if (!cap) return null;
  if (cap.value === null || cap.value === undefined) return cap.note || null;
  return `${cap.value} ${cap.unit || ""}`.trim();
}

function renderFooter() {
  const v = data?.passport?.version ?? "—";
  const upd = data?.passport?.lastUpdate ?? "Veri mevcut değil";
  elFooter.textContent = `Bu dijital pasaport tez prototipidir. Versiyon: ${v} | Son güncelleme: ${upd}`;
}

function drawQR() {
  const el = document.getElementById("qrcode");
  if (!el) return;
  el.innerHTML = "";

  // QR içine hem sayfa hem JSON linki koyuyoruz (tek string)
  const pageUrl = window.location.href;
  const jsonUrl = new URL("./passport.json", window.location.href).toString();
  const payload = `Battery Passport (Demo)\nPage: ${pageUrl}\nJSON: ${jsonUrl}`;

  new QRCode(el, {
    text: payload,
    width: 150,
    height: 150
  });
}

function safeIcons() {
  if (window.lucide && window.lucide.createIcons) {
    window.lucide.createIcons();
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&":"&amp;",
    "<":"&lt;",
    ">":"&gt;",
    '"':"&quot;",
    "'":"&#39;"
  }[c]));
}
