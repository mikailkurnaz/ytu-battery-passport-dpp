window.addEventListener("DOMContentLoaded", function () {
  var app = document.getElementById("app") || document.getElementById("root");
  if (!app) {
    document.body.innerHTML = "<h2>#app bulunamadı</h2><p>index.html içine: &lt;div id='app'&gt;&lt;/div&gt; eklemelisin.</p>";
    return;
  }

  function esc(x) {
    var s = (x === null || x === undefined) ? "" : String(x);
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function icon(name) {
    return '<i data-lucide="' + name + '" style="width:18px;height:18px;"></i>';
  }

  function createIconsSafe() {
    try { if (window.lucide && window.lucide.createIcons) window.lucide.createIcons(); } catch (e) {}
  }

  var state = {
    tab: "overview",
    view: "public",
    data: null
  };

  var TABS = [
    { id: "overview", label: "Genel Bakış", icon: "battery" },
    { id: "carbon", label: "Karbon Ayak İzi", icon: "leaf" },
    { id: "materials", label: "Malzeme Kompozisyonu", icon: "package" },
    { id: "performance", label: "Performans", icon: "zap" },
    { id: "circularity", label: "Döngüsel Ekonomi", icon: "recycle" },
    { id: "compliance", label: "Uyumluluk", icon: "shield" }
  ];

  function allowedTabIds(view) {
    if (view === "public") return ["overview", "carbon", "performance", "circularity"];
    if (view === "professional") return ["overview", "carbon", "materials", "performance", "circularity"];
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
      batteryType: "Çekiş bataryası (Traction Battery)",
      capacity: "Prototip model - alanına göre değişken",
      chemistry: "NMC 811 (80% Ni, 10% Mn, 10% Co)",
      manufactureDate: "2025",
      manufactureCountry: "Fransa"
    },
    carbonFootprint: {
      total: 77,
      unit: "kgCO₂e/kWh",
      reference: "Aulanier et al., 2023",
      stages: { rawMaterial: 35, manufacturing: 28, transport: 8, endOfLife: 6 },
      note: "Çekiş bataryası için özel hesaplama - kapasite bazında normalize edilmiştir"
    },
    materials: [
      { name: "Nikel (Ni)", percentage: 42, recyclable: true, source: "Veri mevcut değil", recycledContent: "Veri mevcut değil" },
      { name: "Mangan (Mn)", percentage: 8, recyclable: true, source: "Veri mevcut değil", recycledContent: "Veri mevcut değil" },
      { name: "Kobalt (Co)", percentage: 8, recyclable: true, source: "Veri mevcut değil", recycledContent: "Veri mevcut değil" },
      { name: "Lityum (Li)", percentage: 7, recyclable: true, source: "Veri mevcut değil", recycledContent: "Veri mevcut değil" },
      { name: "Grafit", percentage: 15, recyclable: true, source: "Veri mevcut değil", recycledContent: "Veri mevcut değil" },
      { name: "Alüminyum", percentage: 12, recyclable: true, source: "Veri mevcut değil", recycledContent: "Veri mevcut değil" },
      { name: "Diğer", percentage: 8, recyclable: false, source: "Veri mevcut değil", recycledContent: "Veri mevcut değil" }
    ],
    performance: {
      energyDensity: "Prototip model - kapasite değişken",
      powerDensity: "Veri mevcut değil",
      cycleLife: "Veri mevcut değil",
      chargingTime: "Veri mevcut değil",
      operatingTemp: "Veri mevcut değil",
      stateOfHealth: "Yeni üretim - %100"
    },
    circularity: {
      repairability: "Veri mevcut değil",
      recyclability: "Veri mevcut",
      recycledContent: "Veri mevcut değil",
      dismantlingInfo: "Veri mevcut",
      secondLife: "Veri mevcut değil",
      safetyDataSheet: "Veri mevcut"
    }
  };

  function normalizeData(json) {
    // passport.json okunsa bile okunmasa bile bu demo çalışsın diye
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
      var active = (state.view === id);
      var style = active
        ? "background:#3b82f6;color:#fff;border:1px solid #3b82f6;"
        : "background:#0b1226;color:#cbd5e1;border:1px solid #1f2937;";
      return '<button class="btn" data-view="' + id + '" style="' + style + 'padding:10px 12px;border-radius:14px;font-weight:900;">' +
        icon(ic) + " " + esc(text) + "</button>";
    }

    function mini(k, v, cls) {
      var mono = (k === "Pasaport ID") ? "font-family:ui-monospace, monospace;" : "";
      return '<div class="mini ' + (cls || "") + '"><p class="k">' + esc(k) + '</p><p class="v" style="' + mono + '">' + esc(v) + "</p></div>";
    }

    return (
      '<div class="card">' +
        '<div class="header">' +
          '<div class="brand">' +
            '<div class="logo">' + icon("battery") + '</div>' +
            '<div>' +
              '<h1 class="title">Dijital Batarya Pasaportu</h1>' +
              '<p class="subtitle">Tez Prototipi (EU 2023/1542 & ESPR)</p>' +
              '<p class="small">Görünüm: <b>' + esc(viewLabel(state.view)) + '</b></p>' +
            '</div>' +
          '</div>' +
          '<div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end;">' +
            viewBtn("public", "Kamuya Açık", "globe") +
            viewBtn("professional", "Profesyonel", "briefcase") +
            viewBtn("controller", "Denetleyici Mekanizma", "shield") +
          '</div>' +
        '</div>' +

        '<div class="grid4">' +
          mini("Pasaport ID", b.id, "") +
          mini("Batarya Türü", b.batteryType, "green") +
          mini("Kimya", "NMC 811", "purple") +
          mini("Üretim Ülkesi", b.manufactureCountry, "amber") +
        '</div>' +
      '</div>'
    );
  }

  function tabsHTML() {
    var allowed = allowedTabIds(state.view);
    var out = '<div class="card" style="padding:6px;"><div class="tabs">';
    for (var i = 0; i < TABS.length; i++) {
      var t = TABS[i];
      if (allowed.indexOf(t.id) === -1) continue;
      out += '<button class="tab ' + (state.tab === t.id ? "active" : "") + '" data-tab="' + t.id + '">' +
        icon(t.icon) + "<span>" + esc(t.label) + "</span></button>";
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

      return '<div class="kv" style="border-left-color:' + border + ';">' +
        '<div class="k">' + esc(label) + '</div>' +
        '<div class="v">' + esc(value) + "</div></div>";
    }

    return (
      "<h2>Genel Bilgiler</h2>" +
      '<div class="row">' +
        '<div class="box">' +
          kv("Üretici", b.manufacturer, "blue") +
          kv("Kimya Yapısı", b.chemistry, "green") +
          kv("Üretim Yılı", b.manufactureDate, "purple") +
          kv("Üretim Ülkesi", b.manufactureCountry, "amber") +
          kv("Nominal Kapasite", b.capacity, "pink") +
        "</div>" +

        '<div class="box">' +
          '<h3 style="display:flex;gap:8px;align-items:center;">' + icon("check-circle") + "Uyumluluk Durumu</h3>" +
          '<div class="small" style="line-height:1.9;">' +
            "• EU Battery Regulation 2023/1542<br/>" +
            "• ESPR Requirements<br/>" +
            "• Due Diligence Regulation<br/>" +
            "• RoHS & REACH Compliant<br/>" +
          "</div>" +
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
      endOfLife: "Ömür Sonu"
    };

    function row(key) {
      var val = Number(st[key]) || 0;
      var pct = total > 0 ? (val / total * 100) : 0;
      return (
        '<div style="margin-bottom:12px;">' +
          '<div style="display:flex;justify-content:space-between;gap:10px;">' +
            "<b>" + esc(names[key]) + "</b>" +
            "<b>" + esc(val) + " " + esc(cf.unit) + " (" + pct.toFixed(1) + "%)</b>" +
          "</div>" +
          '<div class="barwrap"><div class="bar" style="width:' + pct + '%;"></div></div>' +
        "</div>"
      );
    }

    return (
      '<div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;">' +
        "<h2>Karbon Ayak İzi</h2>" +
        '<div style="text-align:right;">' +
          '<div style="font-size:28px;font-weight:1000;color:#22c55e;">' + esc(cf.total) + " " + esc(cf.unit) + "</div>" +
          '<div class="small">Kaynak: ' + esc(cf.reference) + "</div>" +
        "</div>" +
      "</div>" +
      '<div class="box" style="margin-top:10px;">' +
        '<span class="pill blue">' + icon("alert-circle") + " Önemli Not</span>" +
        '<div class="muted" style="margin-top:8px;">' + esc(cf.note) + "</div>" +
      "</div>" +
      '<div class="row" style="margin-top:12px;">' +
        '<div class="box">' +
          "<h3>Tahmini Yaşam Döngüsü Dağılımı</h3>" +
          row("rawMaterial") + row("manufacturing") + row("transport") + row("endOfLife") +
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
    var out = "<h2>Malzeme Kompozisyonu</h2>";

    out += '<div class="box"><div class="small">Yüzdeler prototip/demo amaçlıdır.</div></div>';
    out += '<div class="box" style="margin-top:12px;">';

    for (var i = 0; i < mats.length; i++) {
      var m = mats[i];
      var pct = Number(m.percentage) || 0;
      out +=
        '<div class="box" style="margin:0 0 10px;">' +
          '<div class="mat">' +
            '<div class="matL">' +
              '<div class="badgePct">' + esc(pct) + "%</div>" +
              "<div>" +
                '<div style="font-weight:1000;">' + esc(m.name) + "</div>" +
                '<div class="small">Kaynak: ' + esc(m.source || "Veri mevcut değil") + "</div>" +
              "</div>" +
            "</div>" +
            (m.recyclable ? '<span class="pill green">' + icon("recycle") + " Geri Dönüştürülebilir</span>"
                          : '<span class="pill">' + icon("alert-circle") + " Sınırlı</span>") +
          "</div>" +
          '<div class="barwrap"><div class="bar" style="width:' + pct + '%;background:linear-gradient(90deg,#60a5fa,#a855f7);"></div></div>' +
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
      stateOfHealth: "Sağlık Durumu (SoH)"
    };

    function card(key) {
      return (
        '<div class="box" style="background:#0b1226;margin:0;">' +
          '<div class="small">' + esc(labels[key]) + "</div>" +
          '<div style="font-size:18px;font-weight:1000;margin-top:6px;">' + esc(p[key] || "Veri mevcut değil") + "</div>" +
        "</div>"
      );
    }

    return (
      "<h2>Performans</h2>" +
      '<div class="box">' +
        '<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;">' +
          card("energyDensity") + card("powerDensity") + card("cycleLife") +
          card("chargingTime") + card("operatingTemp") + card("stateOfHealth") +
        "</div>" +
      "</div>"
    );
  }

  function circularityHTML(d) {
    var c = d.circularity || {};
    return (
      "<h2>Döngüsel Ekonomi</h2>" +
      '<div class="row">' +
        '<div class="box">' +
          '<div class="pill amber">' + icon("alert-circle") + " Onarılabilirlik</div>" +
          '<div style="margin-top:10px;font-weight:1000;">' + esc(c.repairability) + "</div>" +
        "</div>" +
        '<div class="box">' +
          '<div class="pill green">' + icon("check-circle") + " Geri Dönüşüm</div>" +
          '<div style="margin-top:10px;font-weight:1000;">' + esc(c.recyclability) + "</div>" +
        "</div>" +
      "</div>"
    );
  }

  // Uyumluluk: sadece Uyumlu (Demo)
  function complianceHTML() {
    return (
      "<h2>Uyumluluk</h2>" +
      '<div class="row">' +
        '<div class="box">' +
          '<div style="display:flex;gap:10px;align-items:center;">' +
            icon("shield") + "<div><b>EU Battery Regulation</b><div class='small'>2023/1542</div></div>" +
          "</div>" +
          '<div style="margin-top:12px;"><span class="pill green">' + icon("check-circle") + " Uyumlu (Demo)</span></div>" +
        "</div>" +
        '<div class="box">' +
          '<div style="display:flex;gap:10px;align-items:center;">' +
            icon("leaf") + "<div><b>ESPR</b><div class='small'>Ecodesign Regulation</div></div>" +
          "</div>" +
          '<div style="margin-top:12px;"><span class="pill green">' + icon("check-circle") + " Uyumlu (Demo)</span></div>" +
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
      '<div class="card content">' + contentHTML(d) + "</div>" +
      '<div class="footer small">Bu prototip tez çalışması kapsamında hazırlanmıştır.</div>';

    createIconsSafe();
  }

  function load() {
    fetch("./passport.json", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
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

  // başlat
  state.data = normalizeData(null);
  render();
  load();
});
