window.addEventListener("DOMContentLoaded", function () {
  var app = document.getElementById("app") || document.getElementById("root");
  if (!app) {
    document.body.innerHTML =
      "<h2>#app bulunamadı</h2><p>index.html içine: &lt;div id='app'&gt;&lt;/div&gt; eklemelisin.</p>";
    return;
  }

  function esc(x) {
    var s = x === null || x === undefined ? "" : String(x);
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function icon(name) {
    return '<i data-lucide="' + name + '" harmonize style="width:18px;height:18px;"></i>';
  }
  
function isMissing(val) {
  const s = String(val ?? "").trim().toLowerCase();
  return s === "" || s.includes("veri mevcut değil") || s.includes("mevcut değil");
}

function statusFor(val) {
  return isMissing(val)
    ? { pillClass: "warn", icon: "alert-circle" }
    : { pillClass: "ok", icon: "check-circle" };
}
  
  function createIconsSafe() {
    try {
      if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
    } catch (e) {}
  }

  var state = {
    tab: "overview",
    view: "public",
    data: null,
  };

  var TABS = [
    { id: "overview", label: "Genel Bakış", icon: "battery" },
    { id: "carbon", label: "Karbon Ayak İzi", icon: "leaf" },
    { id: "materials", label: "Malzeme", icon: "package" },
    { id: "performance", label: "Performans", icon: "zap" },
    { id: "circularity", label: "Döngüsel Ekonomi", icon: "recycle" },
    { id: "compliance", label: "Uyumluluk", icon: "shield" },
  ];

  function allowedTabIds(view) {
    if (view === "public") return ["overview", "carbon", "performance", "circularity"];
    if (view === "professional")
      return ["overview", "carbon", "materials", "performance", "circularity"];
    return ["overview", "carbon", "materials", "performance", "circularity", "compliance"]; // denetleyici
  }

  function ensureTabAllowed() {
    var allowed = allowedTabIds(state.view);
    if (allowed.indexOf(state.tab) === -1) state.tab = allowed[0];
  }

  function viewLabel(v) {
    if (v === "public") return "Kamuya Açık";
    if (v === "professional") return "Profesyonel";
    return "Denetleyici Mekanizma";
  }

  var DEFAULT = {
    batteryData: {
      id: "NMC-BAT-2025-FR-8105",
      manufacturer: "Veri mevcut değil",
      model: "Çekiş Bataryası - NMC 811",
      batteryType: "Lityum iyon Çekiş bataryası",
      capacity: "52 kWh",
      chemistry: "NMC 811 (80% Ni, 10% Mn, 10% Co)",
      manufactureDate: "2025",
      manufactureCountry: "Fransa",
    },
    carbonFootprint: {
      total: 77,
      unit: "kgCO₂e/kWh",
      reference: "Aulanier et al., 2023",
      stages: { rawMaterial: 35, manufacturing: 28, transport: 8, endOfLife: 6 },
      note: "Çekiş bataryası için özel hesaplama - kapasite bazında normalize edilmiştir",
    },
    materials: [
      { name: "Nikel (Ni)", percentage: 42, recyclable: true, source: "Veri mevcut değil", recycledContent: "Veri mevcut değil" },
      { name: "Mangan (Mn)", percentage: 8, recyclable: true, source: "Veri mevcut değil", recycledContent: "Veri mevcut değil" },
      { name: "Kobalt (Co)", percentage: 8, recyclable: true, source: "Veri mevcut değil", recycledContent: "Veri mevcut değil" },
      { name: "Lityum (Li)", percentage: 7, recyclable: true, source: "Veri mevcut değil", recycledContent: "Veri mevcut değil" },
      { name: "Grafit", percentage: 15, recyclable: true, source: "Veri mevcut değil", recycledContent: "Veri mevcut değil" },
      { name: "Alüminyum", percentage: 12, recyclable: true, source: "Veri mevcut değil", recycledContent: "Veri mevcut değil" },
      { name: "Diğer", percentage: 8, recyclable: false, source: "Veri mevcut değil", recycledContent: "Veri mevcut değil" },
    ],
    performance: {
      energyDensity: "52 kWh",
      powerDensity: "Veri mevcut değil",
      cycleLife: "Veri mevcut değil",
      chargingTime: "Veri mevcut değil",
      operatingTemp: "Veri mevcut değil",
      stateOfHealth: "Yeni üretim - %100",
    },
    circularity: {
      repairability: "Veri mevcut değil",
      recyclability: "Veri mevcut",
      recycledContent: "Veri mevcut değil",
      dismantlingInfo: "Veri mevcut",
      secondLife: "Veri mevcut değil",
      safetyDataSheet: "Veri mevcut",
    },
  };

  function normalizeData(json) {
    json = json || {};
    var d = JSON.parse(JSON.stringify(DEFAULT)); // kopya

    try {
      if (json.passport && json.passport.id) d.batteryData.id = json.passport.id;

      if (json.battery) {
        if (json.battery.manufacturer) d.batteryData.manufacturer = json.battery.manufacturer;
        if (json.battery.model) d.batteryData.model = json.battery.model;
        if (json.battery.batteryType) d.batteryData.batteryType = json.battery.batteryType;
        if (json.battery.capacity) d.batteryData.capacity = json.battery.capacity;
        if (json.battery.chemistry && json.battery.chemistry.label) d.batteryData.chemistry = json.battery.chemistry.label;
        if (json.battery.manufacturing) {
          if (json.battery.manufacturing.year) d.batteryData.manufactureDate = json.battery.manufacturing.year;
          if (json.battery.manufacturing.country) d.batteryData.manufactureCountry = json.battery.manufacturing.country;
        }
      }

      if (json.carbonFootprint) d.carbonFootprint = json.carbonFootprint;
      if (Array.isArray(json.materials)) d.materials = json.materials;
      if (json.performance) d.performance = json.performance;
      if (json.circularity) d.circularity = json.circularity;
    } catch (e) {}

    return d;
  }

  function headerHTML(d) {
    var b = d.batteryData;

    function viewBtn(id, text, ic) {
      var active = state.view === id;
      var style = active
        ? "background:#3b82f6;color:#fff;border:1px solid #3b82f6;"
        : "background:#0b1226;color:#cbd5e1;border:1px solid #1f2937;";
      return (
        '<button class="btn" data-view="' +
        id +
        '" style="' +
        style +
        "padding:10px 12px;border-radius:14px;font-weight:900;display:flex;gap:8px;align-items:center;\">" +
        icon(ic) +
        " " +
        esc(text) +
        "</button>"
      );
    }

    function mini(k, v, cls) {
      var mono = k === "Pasaport ID" ? "font-family:ui-monospace, monospace;" : "";
      return (
        '<div class="mini ' +
        (cls || "") +
        '"><p class="k">' +
        esc(k) +
        '</p><p class="v" style="' +
        mono +
        '">' +
        esc(v) +
        "</p></div>"
      );
    }

    return (
      '<div class="card">' +
      '<div class="header">' +
      '<div class="brand">' +
      '<div class="logo">' +
      icon("battery") +
      "</div>" +
      "<div>" +
      '<h1 class="title">DPP / Batarya Pasaportu</h1>' +
      '<p class="subtitle">Tez Prototipi (Battery Regulation & ESPR)</p>' +
      '<p class="small">Görünüm: <b>' +
      esc(viewLabel(state.view)) +
      "</b></p>" +
      "</div>" +
      "</div>" +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end;">' +
      viewBtn("public", "Kamuya Açık", "globe") +
      viewBtn("professional", "Profesyonel", "briefcase") +
      viewBtn("controller", "Denetleyici Mekanizma", "shield") +
      "</div>" +
      "</div>" +
      '<div class="grid4">' +
      mini("Pasaport ID", b.id, "") +
      mini("Batarya Türü", b.batteryType, "green") +
      mini("Kimya", "NMC 811", "purple") +
      mini("Üretim Ülkesi", b.manufactureCountry, "amber") +
      "</div>" +
      "</div>"
    );
  }

  function tabsHTML() {
    var allowed = allowedTabIds(state.view);
    var out = '<div class="card" style="padding:6px;"><div class="tabs">';
    for (var i = 0; i < TABS.length; i++) {
      var t = TABS[i];
      if (allowed.indexOf(t.id) === -1) continue;
      out +=
        '<button class="tab ' +
        (state.tab === t.id ? "active" : "") +
        '" data-tab="' +
        t.id +
        '" style="display:flex;gap:8px;align-items:center;">' +
        icon(t.icon) +
        "<span>" +
        esc(t.label) +
        "</span></button>";
    }
    out += "</div></div>";
    return out;
  }

  function overviewHTML(d) {
    var b = d.batteryData;

    function kv(label, value, color) {
      var border = "#3b82f6";
      if (color === "green") border = "#22c55e";
      if (color === "purple") border = "#a855f7";
      if (color === "amber") border = "#f59e0b";
      if (color === "pink") border = "#ec4899";

      return (
        '<div class="kv" style="border-left-color:' +
        border +
        ';">' +
        '<div class="k">' +
        esc(label) +
        "</div>" +
        '<div class="v">' +
        esc(value) +
        "</div></div>"
      );
    }

  return (
  "<h2>Genel Bilgiler</h2>" +
  '<div class="row">' +

  // SOL TARAF
  '<div class="box">' +
  kv("Üretici", b.manufacturer, "blue") +
  kv("Üretim Yılı", b.manufactureDate, "purple") +
  kv("Üretim Yeri Adresi", "Veri mevcut değil", "orange") +
   "</div>" +

  // SAĞ TARAF
  '<div class="box">' +
  kv("Model", "Veri mevcut değil", "blue") +
  kv("Kimya Yapısı", b.chemistry, "green") +
  kv("Nominal Kapasite", b.capacity, "pink") +
  "</div>" +

  "</div>"
);
  }

  function carbonHTML(d) {
    var cf = d.carbonFootprint;
    var total = Number(cf.total) || 0;
    var st = cf.stages || {};
    var names = {
      rawMaterial: "Hammadde Çıkarımı",
      manufacturing: "Üretim",
      transport: "Taşıma",
      endOfLife: "Ömür Sonu",
    };

    function row(key) {
      var val = Number(st[key]) || 0;
      var pct = total > 0 ? (val / total) * 100 : 0;
      return (
        '<div style="margin-bottom:12px;">' +
        '<div style="display:flex;justify-content:space-between;gap:10px;">' +
        "<b>" +
        esc(names[key]) +
        "</b>" +
        "<b>" +
        esc(val) +
        " " +
        esc(cf.unit) +
        " (" +
        pct.toFixed(1) +
        "%)</b>" +
        "</div>" +
        '<div class="barwrap"><div class="bar" style="width:' +
        pct +
        '%;"></div></div>' +
        "</div>"
      );
    }

    return (
      '<div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;">' +
      "<h2>Karbon Ayak İzi</h2>" +
      '<div style="text-align:right;">' +
      '<div style="font-size:28px;font-weight:1000;color:#22c55e;">' +
      esc(cf.total) +
      " " +
      esc(cf.unit) +
      "</div>" +
      '<div class="small">Kaynak: ' +
      esc(cf.reference) +
      "</div>" +
      "</div>" +
      "</div>" +
      '<div class="box" style="margin-top:10px;">' +
      '<span class="pill blue" style="display:inline-flex;gap:8px;align-items:center;">' +
      icon("alert-circle") +
      " Önemli Not</span>" +
      '<div class="muted" style="margin-top:8px;">' +
      esc(cf.note) +
      "</div>" +
      "</div>" +
      '<div class="row" style="margin-top:12px;">' +
      '<div class="box">' +
      "<h3>Tahmini Yaşam Döngüsü Dağılımı</h3>" +
      row("rawMaterial") +
      row("manufacturing") +
      row("transport") +
      row("endOfLife") +
      "</div>" +
      '<div class="box">' +
      "<h3>Metodoloji (Özet)</h3>" +
      '<div class="small" style="line-height:1.9;">' +
      "• ISO 14067:2018<br/>" +
      "• Cradle-to-gate<br/>" +
      "• Literatür bazlı tahmin<br/>" +
      "</div>" +
      "</div>" +
      "</div>"
    );
  }

  function materialsHTML(d) {
    var mats = d.materials || [];
    var out = "<h2>Malzeme</h2>";

    out += '<div class="box"><div class="small">Yüzdeler prototip/demo amaçlıdır.</div></div>';
    out += '<div class="box" style="margin-top:12px;">';

    for (var i = 0; i < mats.length; i++) {
      var m = mats[i];
      var pct = Number(m.percentage) || 0;
      out +=
        '<div class="box" style="margin:0 0 10px;">' +
        '<div class="mat">' +
        '<div class="matL">' +
        '<div class="badgePct">' +
        esc(pct) +
        "%</div>" +
        "<div>" +
        '<div style="font-weight:1000;">' +
        esc(m.name) +
        "</div>" +
        '<div class="small">Kaynak: ' +
        esc(m.source || "Veri mevcut değil") +
        "</div>" +
        "</div>" +
        "</div>" +
        (m.recyclable
          ? '<span class="pill green" style="display:inline-flex;gap:8px;align-items:center;">' +
            icon("recycle") +
            " Geri Dönüştürülebilir</span>"
          : '<span class="pill" style="display:inline-flex;gap:8px;align-items:center;">' +
            icon("alert-circle") +
            " Sınırlı</span>") +
        "</div>" +
        '<div class="barwrap"><div class="bar" style="width:' +
        pct +
        '%;background:linear-gradient(90deg,#60a5fa,#a855f7);"></div></div>' +
        "</div>";
    }
    out += "</div>";
    return out;
  }

  function performanceHTML(d) {
    var p = d.performance || {};
    var labels = {
      energyDensity: "Enerji Yoğunluğu",
      powerDensity: "Güç Yoğunluğu",
      cycleLife: "Çevrim Ömrü",
      chargingTime: "Şarj Süresi",
      operatingTemp: "Çalışma Sıcaklığı",
      stateOfHealth: "Sağlık Durumu (SoH)",
    };

    function card(key) {
      return (
        '<div class="box" style="background:#0b1226;margin:0;">' +
        '<div class="small">' +
        esc(labels[key]) +
        "</div>" +
        '<div style="font-size:18px;font-weight:1000;margin-top:6px;">' +
        esc(p[key] || "Veri mevcut değil") +
        "</div>" +
        "</div>"
      );
    }

    return (
      "<h2>Performans</h2>" +
      '<div class="box">' +
      '<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;">' +
      card("energyDensity") +
      card("powerDensity") +
      card("cycleLife") +
      card("chargingTime") +
      card("operatingTemp") +
      card("stateOfHealth") +
      "</div>" +
      "</div>"
    );
  }

  // ✅ İSTEDİĞİN YENİ DÖNGÜSEL EKONOMİ EKRANI
  function circularityHTML(d) {
    var c = d.circularity || {};

    function statusPill(text) {
      var t = String(text || "").toLowerCase();
      var isOk = t.indexOf("mevcut") !== -1 && t.indexOf("değil") === -1;
      var cls = isOk ? "green" : "amber";
      var ic = isOk ? "check-circle" : "alert-circle";
      return (
        '<span class="pill ' +
        cls +
        '" style="display:inline-flex;gap:8px;align-items:center;">' +
        icon(ic) +
        " " +
        esc(text || "Veri mevcut değil") +
        "</span>"
      );
    }

    function infoCard(title, value, type) {
      var headerPill =
        type === "ok"
          ? '<span class="pill green" style="display:inline-flex;gap:8px;align-items:center;">' +
            icon("check-circle") +
            " " +
            esc(title) +
            "</span>"
          : '<span class="pill amber" style="display:inline-flex;gap:8px;align-items:center;">' +
            icon("alert-circle") +
            " " +
            esc(title) +
            "</span>";

      return (
        '<div class="box" style="margin:0;">' +
        headerPill +
        '<div style="margin-top:12px;font-weight:1000;font-size:16px;">' +
        esc(value || "Veri mevcut değil") +
        "</div>" +
        "</div>"
      );
    }

    return (
      "<h2>Döngüsel Ekonomi</h2>" +
      '<div class="row">' +
      // sol taraf: 4 kutu
      '<div class="box" style="background:transparent;border:none;padding:0;margin:0;">' +
      '<div style="display:grid;grid-template-columns:1fr;gap:12px;">' +
      infoCard("Onarılabilirlik Skoru", c.repairability, "warn") +
      infoCard("Geri Dönüşüm Bilgisi", c.recyclability, isMissing(c.recyclability) ? "warn" : "ok") +
      infoCard("Geri Dönüştürülmüş İçerik", c.recycledContent, "warn") +
      infoCard("İkinci Ömür Uygunluğu", c.secondLife, "warn") +
      "</div>" +
      "</div>" +
      // sağ taraf: mevcut dökümanlar
      '<div class="box">' +
      '<h3 style="display:flex;gap:8px;align-items:center;margin-bottom:10px;">' +
      icon("file-text") +
      "Mevcut Dökümanlar</h3>" +
      '<div style="display:grid;gap:10px;">' +
      '<div class="box" style="background:#0b1226;margin:0;">' +
      '<div style="display:flex;gap:10px;align-items:flex-start;">' +
      icon("check-circle") +
      '<div><div style="font-weight:1000;">Söküm Talimatları</div>' +
      '<div class="small">' + esc(c.dismantlingInfo || "Veri mevcut") + "</div></div>" +
      "</div>" +
      "</div>" +
      '<div class="box" style="background:#0b1226;margin:0;">' +
      '<div style="display:flex;gap:10px;align-items:flex-start;">' +
      icon("check-circle") +
      '<div><div style="font-weight:1000;">Güvenlik Veri Sayfası (SDS)</div>' +
      '<div class="small">' + esc(c.safetyDataSheet || "Veri mevcut") + "</div></div>" +
      "</div>" +
      "</div>" +
      "</div>" +
      "</div>" +
      "</div>"
    );
  }

  // ✅ Uyumluluk: EU + ESPR + (RoHS, REACH, CE, Test Raporu, Ürün Sertifikaları)
  // ✅ Test isimleri / sertifika isimleri görünmez
  function complianceHTML() {
    function bigCard(iconName, title, subtitle) {
      return (
        '<div class="box" style="background:rgba(34,197,94,.08);border-color:rgba(34,197,94,.25);">' +
        '<div style="display:flex;gap:10px;align-items:center;">' +
        '<div style="width:44px;height:44px;border-radius:14px;background:#22c55e;display:flex;align-items:center;justify-content:center;">' +
        '<span style="color:#fff;">' +
        icon(iconName) +
        "</span>" +
        "</div>" +
        "<div>" +
        "<div style='font-weight:1000;'>" +
        esc(title) +
        "</div>" +
        "<div class='small'>" +
        esc(subtitle) +
        "</div>" +
        "</div>" +
        "</div>" +
        '<div style="margin-top:12px;"><span class="pill green" style="display:inline-flex;gap:8px;align-items:center;">' +
        icon("check-circle") +
        " Uyumlu (Demo)</span></div>" +
        "</div>"
      );
    }

    function smallCard(iconName, title, subtitle, statusText) {
      return (
        '<div class="box" style="background:#0b1226;">' +
        "<div style='display:flex;gap:10px;align-items:center;'>" +
        "<div style='width:36px;height:36px;border-radius:12px;background:#111827;border:1px solid #1f2937;display:flex;align-items:center;justify-content:center;'>" +
        icon(iconName) +
        "</div>" +
        "<div>" +
        "<div style='font-weight:1000;'>" +
        esc(title) +
        "</div>" +
        "<div class='small'>" +
        esc(subtitle) +
        "</div>" +
        "</div>" +
        "</div>" +
        '<div style="margin-top:10px;"><span class="pill green" style="display:inline-flex;gap:8px;align-items:center;">' +
        icon("check-circle") +
        " " +
        esc(statusText) +
        "</span></div>" +
        "</div>"
      );
    }

    return (
      "<h2>Düzenleyici Uyumluluk</h2>" +
      '<div class="row">' +
      bigCard("shield", "EU Battery Regulation", "2023/1542") +
      bigCard("leaf", "ESPR", "Ecodesign Regulation") +
      "</div>" +
      '<div class="box" style="margin-top:12px;">' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px;">' +
      smallCard("alert-triangle", "RoHS Uyumluluğu", "Tehlikeli madde kısıtlamaları", "Uyumlu (Demo)") +
      smallCard("flask-conical", "REACH Uyumluluğu", "Kimyasal madde uyumu", "Uyumlu (Demo)") +
      smallCard("badge-check", "CE İşaretlemesi", "Avrupa uygunluk beyanı", "Uyumlu (Demo)") +
      smallCard("file-check", "Test Raporu", "Doküman durumu", "Mevcut (Demo)") +
      smallCard("award", "Ürün Sertifikaları", "Doküman durumu", "Mevcut (Demo)") +
      "</div>" +
      "</div>"
    );
  }

  function contentHTML(d) {
    ensureTabAllowed();
    if (state.tab === "overview") return overviewHTML(d);
    if (state.tab === "carbon") return carbonHTML(d);
    if (state.tab === "materials") return materialsHTML(d);
    if (state.tab === "performance") return performanceHTML(d);
    if (state.tab === "circularity") return circularityHTML(d);
    if (state.tab === "compliance") return complianceHTML();
    return '<div class="muted">Sekme bulunamadı</div>';
  }

  function render() {
    ensureTabAllowed();
    var d = state.data;

    app.innerHTML =
      headerHTML(d) +
      tabsHTML() +
      '<div class="card content">' +
      contentHTML(d) +
      "</div>" +
      '<div class="footer small">Bu prototip tez çalışması kapsamında hazırlanmıştır.</div>';

    createIconsSafe();
  }

  function load() {
    fetch("./passport.json", { cache: "no-store" })
      .then(function (r) {
        return r.ok ? r.json() : null;
      })
      .then(function (json) {
        state.data = normalizeData(json);
        render();
      })
      .catch(function () {
        state.data = normalizeData(null);
        render();
      });
  }

  document.addEventListener("click", function (e) {
    var viewBtn = e.target.closest && e.target.closest("[data-view]");
    if (viewBtn) {
      state.view = viewBtn.getAttribute("data-view");
      ensureTabAllowed();
      render();
      return;
    }

    var tabBtn = e.target.closest && e.target.closest("[data-tab]");
    if (tabBtn) {
      var id = tabBtn.getAttribute("data-tab");
      if (allowedTabIds(state.view).indexOf(id) !== -1) {
        state.tab = id;
        render();
      }
    }
  });

  state.data = normalizeData(null);
  render();
  load();
});
