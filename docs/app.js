(function () {
  // =========================
  // 0) DOM Check
  // =========================
  var app = document.getElementById("app");
  if (!app) {
    document.body.innerHTML = "<h1>#app bulunamadı</h1>";
    return;
  }

  // =========================
  // 1) Helpers
  // =========================
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
    // lucide icons: <i data-lucide="..."></i>
    return '<i data-lucide="' + esc(name) + '" style="width:18px;height:18px;"></i>';
  }

  function createIconsSafe() {
    try {
      if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
    } catch (e) {}
  }

  function isMissing(v) {
    if (v === null || v === undefined) return true;
    var s = String(v).trim();
    if (!s) return true;
    return s.toLowerCase().includes("veri mevcut değil");
  }

  function statusVariant(v) {
    return isMissing(v) ? "warn" : "ok";
  }

  function pill(text, variant) {
    var cls = "pill " + (variant || "neutral");
    var ico = (variant === "ok") ? "check-circle" : (variant === "warn" ? "alert-circle" : "info");
    return '<span class="' + cls + '">' + icon(ico) + esc(text) + "</span>";
  }

  function kv(label, value, color) {
    var leftCls = "kv " + ({
      blue: "leftBlue",
      green: "leftGreen",
      purple: "leftPurple",
      amber: "leftAmber",
      orange: "leftOrange",
      pink: "leftPink"
    }[color] || "leftBlue");

    return (
      '<div class="' + leftCls + '">' +
        '<div class="k">' + esc(label) + "</div>" +
        '<div class="v">' + esc(value) + "</div>" +
      "</div>"
    );
  }

  function infoCard(title, value) {
    var v = value;
    var variant = statusVariant(v);
    return (
      '<div class="box">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px;">' +
          '<h3 style="display:flex;gap:8px;align-items:center;margin:0;">' +
            icon(variant === "ok" ? "check-circle" : "alert-circle") +
            esc(title) +
          "</h3>" +
          pill(variant === "ok" ? "Mevcut" : "Veri mevcut değil", variant) +
        "</div>" +
        '<div class="small">' + esc(isMissing(v) ? "Veri mevcut değil" : v) + "</div>" +
      "</div>"
    );
  }

  // =========================
  // 2) State + Tabs
  // =========================
  var state = {
    view: "public",      // public | professional | controller
    tab: "overview",
    data: null,
    error: null
  };

  var VIEW_LABEL = {
    public: "Kamuya Açık",
    professional: "Profesyonel",
    controller: "Denetleyici Mekanizma"
  };

  var TABS = [
    { id: "overview",   label: "Genel",            icon: "battery" },
    { id: "carbon",     label: "Karbon Ayak İzi",  icon: "leaf" },
    { id: "materials",  label: "Malzeme",          icon: "package" },
    { id: "performance",label: "Performans",       icon: "zap" },
    { id: "circularity",label: "Döngüsel Ekonomi", icon: "recycle" },
    { id: "compliance", label: "Uyumluluk",        icon: "shield" },
    { id: "dynamic",    label: "Dinamik Veriler",  icon: "activity" }
  ];

  function allowedTabIds(view) {
    // ✅ Kullanıcı isteği: Dinamik verileri kamu da görsün
    if (view === "public") {
      return ["overview", "carbon", "performance", "circularity", "dynamic"];
    }
    if (view === "professional") {
      return ["overview", "carbon", "materials", "performance", "circularity", "dynamic"];
    }
    // controller
    return ["overview", "carbon", "materials", "performance", "circularity", "compliance", "dynamic"];
  }

  function ensureTabAllowed() {
    var allowed = allowedTabIds(state.view);
    if (allowed.indexOf(state.tab) === -1) state.tab = allowed[0];
  }

  // =========================
  // 3) Data (fallback + normalize)
  // =========================
  var DEFAULT = {
    passport: { id: "NMC-BAT-2025-FR-8105", version: "v1.0", status: "prototype", lastUpdate: "Veri mevcut değil" },
    battery: {
      manufacturer: "Veri mevcut değil",
      category: "Çekiş bataryası (Traction Battery)",
      model: "Veri mevcut değil",
      capacity: "52 kWh",
      weight: "Veri mevcut değil",
      chemistry: { code: "NMC 811", label: "NMC 811 (80% Ni, 10% Mn, 10% Co)" },
      manufacturing: { month: "Veri mevcut değil", year: "2025", country: "Fransa", address: "Veri mevcut değil" }
    },
    materials: {
      criticalRawMaterials: "Veri mevcut değil",
      hazardousSubstances: "Veri mevcut değil",
      compositionList: [],
      detailedComposition: { cathode: "Veri mevcut değil", anode: "Veri mevcut değil", electrolyte: "Veri mevcut değil" },
      partsInfo: { partNumbers: "Veri mevcut değil", sparePartsContact: "Veri mevcut değil" }
    },
    sustainability: {
      carbonFootprint: {
        total: 77,
        unit: "kgCO2e/kWh",
        reference: "Aulanier et al., 2023",
        note: "Çekiş bataryası için literatür bazlı demo değer (prototip).",
        stages: { rawMaterial: 35, manufacturing: 28, transport: 8, endOfLife: 6 }
      }
    },
    performance: {
      nominalCapacity: "52 kWh",
      voltage: { min: "Veri mevcut değil", nom: "Veri mevcut değil", max: "Veri mevcut değil" },
      powerCapacity: "Veri mevcut değil",
      temperatureRange: "Veri mevcut değil",
      cycleLife: "Veri mevcut değil",
      energyEfficiency: "Veri mevcut değil"
    },
    circularity: {
      repairability: "Veri mevcut değil",
      recyclability: "Veri mevcut değil",
      recycledContent: "Veri mevcut değil",
      secondLife: "Veri mevcut değil",
      documents: { dismantlingInstructions: "Veri mevcut değil", sds: "Veri mevcut değil" }
    },
    compliance: {
      rohs: "Uyumlu (Demo)",
      reach: "Uyumlu (Demo)",
      ce: "Uyumlu (Demo)",
      testReport: "Veri mevcut değil",
      productCertificates: "Veri mevcut değil"
    },
    dynamicData: {
      performanceValues: "Veri mevcut değil",
      soh: "Veri mevcut değil",
      batteryStatus: "Veri mevcut değil",
      usageData: "Veri mevcut değil"
    }
  };

  function normalizeData(json) {
    var j = json || {};
    // Eski/alternatif yapılarla da çökmesin diye: her bölüm fallback’li
    return {
      passport: j.passport || DEFAULT.passport,
      battery: j.battery || DEFAULT.battery,
      materials: j.materials || DEFAULT.materials,
      sustainability: j.sustainability || DEFAULT.sustainability,
      performance: j.performance || DEFAULT.performance,
      circularity: j.circularity || DEFAULT.circularity,
      compliance: j.compliance || DEFAULT.compliance,
      legalAndWaste: j.legalAndWaste || {},
      dynamicData: j.dynamicData || DEFAULT.dynamicData
    };
  }

  async function load() {
    try {
      // cache kırmak için ts paramı
      var res = await fetch("./passport.json?ts=" + Date.now(), { cache: "no-store" });
      var json = await res.json();
      state.data = normalizeData(json);
      state.error = null;
    } catch (e) {
      state.data = normalizeData(DEFAULT);
      state.error = "passport.json okunamadı, demo veri gösteriliyor.";
    }
    render();
  }

  // =========================
  // 4) Render
  // =========================
  function headerHTML(d) {
    var b = d.battery;
    var p = d.passport;

    return (
      '<div class="header">' +
        '<div class="headerTop">' +
          '<div class="brand">' +
            '<div class="logo">' + icon("battery") + "</div>" +
            "<div>" +
              "<h1>Dijital Batarya Pasaportu</h1>" +
              '<div class="sub">EU Battery Regulation 2023/1542 & ESPR (Demo)</div>' +
            "</div>" +
          "</div>" +

          '<div class="modeBtns">' +
            modeBtn("controller") +
            modeBtn("public") +
            modeBtn("professional") +
          "</div>" +
        "</div>" +

        '<div class="idGrid">' +
          mini("Pasaport ID", '<span class="mono">' + esc(p.id) + "</span>") +
          mini("Batarya Türü", esc(b.category)) +
          mini("Kimya", esc((b.chemistry && (b.chemistry.code || b.chemistry.label)) || "Veri mevcut değil")) +
          mini("Üretim Ülkesi", esc((b.manufacturing && b.manufacturing.country) || b.manufactureCountry || "Veri mevcut değil")) +
        "</div>" +

        (state.error ? '<div class="notice">⚠ ' + esc(state.error) + "</div>" : "") +
      "</div>"
    );
  }

  function modeBtn(view) {
    var active = (state.view === view) ? "active" : "";
    var name = VIEW_LABEL[view] || view;

    var ico = view === "controller" ? "shield" : (view === "professional" ? "briefcase" : "globe");
    return (
      '<button class="btn ' + active + '" data-view="' + esc(view) + '">' +
        icon(ico) +
        esc(name) +
      "</button>"
    );
  }

  function mini(k, v) {
    return (
      '<div class="mini">' +
        '<div class="k">' + esc(k) + "</div>" +
        '<div class="v">' + v + "</div>" +
      "</div>"
    );
  }

  function tabsHTML() {
    var allowed = allowedTabIds(state.view);
    var items = TABS.filter(function (t) { return allowed.indexOf(t.id) !== -1; });

    return (
      '<div class="tabs"><div class="tabsInner">' +
        items.map(function (t) {
          var active = (state.tab === t.id) ? "active" : "";
          return (
            '<button class="tabBtn ' + active + '" data-tab="' + esc(t.id) + '">' +
              icon(t.icon) +
              "<span>" + esc(t.label) + "</span>" +
            "</button>"
          );
        }).join("") +
      "</div></div>"
    );
  }

  function contentHTML(d) {
    var html = "";

    if (state.tab === "overview") html = overviewHTML(d);
    else if (state.tab === "carbon") html = carbonHTML(d);
    else if (state.tab === "materials") html = materialsHTML(d);
    else if (state.tab === "performance") html = performanceHTML(d);
    else if (state.tab === "circularity") html = circularityHTML(d);
    else if (state.tab === "compliance") html = complianceHTML(d);
    else if (state.tab === "dynamic") html = dynamicHTML(d);
    else html = "<h2>Sayfa bulunamadı</h2>";

    return '<div class="content">' + html + "</div>";
  }

  function render() {
    ensureTabAllowed();

    var d = state.data || normalizeData(DEFAULT);

    app.innerHTML =
      headerHTML(d) +
      tabsHTML() +
      contentHTML(d) +
      '<div class="footer">Son Güncelleme: ' + esc((d.passport && d.passport.lastUpdate) || "Veri mevcut değil") +
      " | Versiyon: " + esc((d.passport && d.passport.version) || "v1.0") +
      "</div>";

    // Events
    Array.prototype.forEach.call(document.querySelectorAll("[data-view]"), function (el) {
      el.addEventListener("click", function () {
        state.view = el.getAttribute("data-view");
        ensureTabAllowed();
        render();
      });
    });

    Array.prototype.forEach.call(document.querySelectorAll("[data-tab]"), function (el) {
      el.addEventListener("click", function () {
        state.tab = el.getAttribute("data-tab");
        render();
      });
    });

    createIconsSafe();
  }

  // =========================
  // 5) Screens
  // =========================

  // Genel:
  // - Uyumluluk Durumu KALDIRILDI (kullanıcı isteği)
  // - "Üretim Yeri Adresi" + "Model" eklendi
  // - Ekran 2 kolona bölündü: Modelden sonrası sağ kolonda başlıyor
  function overviewHTML(d) {
    var b = d.battery || {};
    var m = b.manufacturing || {};
    var chem = b.chemistry || {};

    // Sol kolon: model dahil
    var left =
      kv("Üretici", b.manufacturer || "Veri mevcut değil", "blue") +
      kv("Batarya Türü", b.category || "Veri mevcut değil", "green") +
      kv("Üretim Ülkesi", m.country || "Veri mevcut değil", "amber") +
      kv("Üretim (Ay/Yıl)", ((m.month || "Veri mevcut değil") + " / " + (m.year || "Veri mevcut değil")), "purple") +
      kv("Üretim Yeri Adresi", m.address || "Veri mevcut değil", "orange") +
      kv("Model", b.model || "Veri mevcut değil", "blue");

    // Sağ kolon: modelden sonra başlayan kısım
    var right =
      kv("Pil Kimyası", chem.label || chem.code || "Veri mevcut değil", "green") +
      kv("Ağırlık", b.weight || "Veri mevcut değil", "pink") +
      kv("Nominal Kapasite", b.capacity || "Veri mevcut değil", "pink");

    return (
      "<h2>Genel Bilgiler</h2>" +
      '<div class="row">' +
        '<div class="box">' + left + "</div>" +
        '<div class="box">' + right + "</div>" +
      "</div>"
    );
  }

  // Karbon Ayak İzi:
  // - Metodoloji KALDIRILDI (kullanıcı isteği)
  function carbonHTML(d) {
    var cf = (d.sustainability && d.sustainability.carbonFootprint) || {};
    var total = (cf.total !== undefined && cf.total !== null) ? cf.total : "Veri mevcut değil";
    var unit = cf.unit || "kgCO2e/kWh";
    var ref = cf.reference || "Veri mevcut değil";
    var note = cf.note || "Veri mevcut değil";

    var stages = cf.stages || {};
    var items = [
      { key: "rawMaterial",   label: "Hammadde Çıkarımı", value: stages.rawMaterial },
      { key: "manufacturing", label: "Üretim",            value: stages.manufacturing },
      { key: "transport",     label: "Taşıma",            value: stages.transport },
      { key: "endOfLife",     label: "Ömür Sonu",         value: stages.endOfLife }
    ];

    var sum = 0;
    items.forEach(function (it) {
      if (typeof it.value === "number") sum += it.value;
    });

    var list = items.map(function (it) {
      var v = (it.value === undefined || it.value === null) ? 0 : it.value;
      var pct = (sum > 0 && typeof v === "number") ? (v / sum * 100) : 0;
      return (
        '<div class="box">' +
          '<div style="display:flex;justify-content:space-between;gap:10px;align-items:center;">' +
            "<div><b>" + esc(it.label) + "</b></div>" +
            '<div class="small">' + esc(v) + " " + esc(unit) + " (" + pct.toFixed(1) + "%)</div>" +
          "</div>" +
          '<div class="barWrap"><div class="bar" style="width:' + pct.toFixed(1) + '%"></div></div>' +
        "</div>"
      );
    }).join("");

    return (
      '<div style="display:flex;justify-content:space-between;gap:14px;align-items:flex-end;flex-wrap:wrap;">' +
        "<h2>Karbon Ayak İzi</h2>" +
        '<div style="text-align:right">' +
          '<div style="font-size:30px;font-weight:900;color:rgba(34,197,94,.95)">' + esc(total) + " " + esc(unit) + "</div>" +
          '<div class="small">Kaynak: ' + esc(ref) + "</div>" +
        "</div>" +
      "</div>" +
      '<div class="box" style="margin:10px 0 12px;">' +
        '<div class="small"><b>Not:</b> ' + esc(note) + "</div>" +
      "</div>" +
      '<div class="row">' +
        '<div class="box">' +
          "<h3>Tahmini Yaşam Döngüsü Dağılımı</h3>" +
          '<div class="small">Aşağıdaki dağılım demo amaçlıdır.</div>' +
        "</div>" +
        '<div class="box">' +
          "<h3>Dağılım (Detay)</h3>" +
          '<div class="small">Hammadde / Üretim / Taşıma / Ömür Sonu</div>' +
        "</div>" +
      "</div>" +
      '<div class="row" style="margin-top:12px;">' +
        '<div style="display:grid;gap:12px;">' + list + "</div>" +
        '<div class="box">' +
          "<h3>Özet</h3>" +
          '<div class="small">Toplam değer ve aşama dağılımı bu ekranda görüntülenir.</div>' +
        "</div>" +
      "</div>"
    );
  }

  // Malzeme:
  // - Kamu: sadece kritik ham madde + tehlikeli madde
  // - Profesyonel/Denetim: ayrıca detaylı bileşim + parça bilgileri + yüzdeli liste
  function materialsHTML(d) {
    var mat = d.materials || {};
    var isPublic = (state.view === "public");

    var publicBox =
      "<h2>Malzeme</h2>" +
      '<div class="row">' +
        infoCard("Kritik Ham Maddeler", mat.criticalRawMaterials || "Veri mevcut değil") +
        infoCard("Tehlikeli Maddeler", mat.hazardousSubstances || "Veri mevcut değil") +
      "</div>";

    if (isPublic) return publicBox;

    // profesyonel / denetim
    var det = mat.detailedComposition || {};
    var parts = mat.partsInfo || {};
    var list = Array.isArray(mat.compositionList) ? mat.compositionList : [];

    var listHTML = (list.length ? list.map(function (x) {
      var pct = (x.percentage === undefined || x.percentage === null) ? "—" : (x.percentage + "%");
      return (
        '<div class="listItem">' +
          '<div style="display:flex;gap:12px;align-items:flex-start;">' +
            '<div class="badge">' + esc(pct) + "</div>" +
            "<div>" +
              "<div style=\"font-weight:900\">" + esc(x.name || "Malzeme") + "</div>" +
              '<div class="small">Kaynak: ' + esc(x.source || "Veri mevcut değil") + "</div>" +
              '<div class="small">Geri dönüştürülmüş içerik: ' + esc(x.recycledContent || "Veri mevcut değil") + "</div>" +
            "</div>" +
          "</div>" +
          pill((x.recyclable ? "Geri Dönüştürülebilir" : "Sınırlı"), x.recyclable ? "ok" : "warn") +
        "</div>"
      );
    }).join("") : '<div class="small">Veri mevcut değil</div>');

    return (
      "<h2>Malzeme</h2>" +
      '<div class="row">' +
        infoCard("Kritik Ham Maddeler", mat.criticalRawMaterials || "Veri mevcut değil") +
        infoCard("Tehlikeli Maddeler", mat.hazardousSubstances || "Veri mevcut değil") +
      "</div>" +

      '<div class="row" style="margin-top:12px;">' +
        '<div class="box">' +
          '<h3 style="display:flex;gap:8px;align-items:center;">' + icon("layers") + "Detaylı Bileşim</h3>" +
          '<div class="small"><b>Katot:</b> ' + esc(det.cathode || "Veri mevcut değil") + "</div>" +
          '<div class="small"><b>Anot:</b> ' + esc(det.anode || "Veri mevcut değil") + "</div>" +
          '<div class="small"><b>Elektrolit:</b> ' + esc(det.electrolyte || "Veri mevcut değil") + "</div>" +
        "</div>" +
        '<div class="box">' +
          '<h3 style="display:flex;gap:8px;align-items:center;">' + icon("wrench") + "Parça Bilgileri</h3>" +
          '<div class="small"><b>Parça Numaraları:</b> ' + esc(parts.partNumbers || "Veri mevcut değil") + "</div>" +
          '<div class="small"><b>Yedek Parça İletişim:</b> ' + esc(parts.sparePartsContact || "Veri mevcut değil") + "</div>" +
        "</div>" +
      "</div>" +

      '<div class="box" style="margin-top:12px;">' +
        '<h3 style="display:flex;gap:8px;align-items:center;">' + icon("package") + "Malzeme Dağılımı (Demo)</h3>" +
        listHTML +
      "</div>"
    );
  }

  // Performans
  function performanceHTML(d) {
    var p = d.performance || {};
    var v = p.voltage || {};

    return (
      "<h2>Performans</h2>" +
      '<div class="row">' +
        infoCard("Nominal Kapasite", p.nominalCapacity || "Veri mevcut değil") +
        infoCard("Güç Kapasitesi", p.powerCapacity || "Veri mevcut değil") +
      "</div>" +
      '<div class="row" style="margin-top:12px;">' +
        infoCard("Voltaj (Min/Nom/Max)", (v.min || "Veri mevcut değil") + " / " + (v.nom || "Veri mevcut değil") + " / " + (v.max || "Veri mevcut değil")) +
        infoCard("Sıcaklık Aralığı", p.temperatureRange || "Veri mevcut değil") +
      "</div>" +
      '<div class="row" style="margin-top:12px;">' +
        infoCard("Döngü Ömrü", p.cycleLife || "Veri mevcut değil") +
        infoCard("Enerji Verimliliği", p.energyEfficiency || "Veri mevcut değil") +
      "</div>"
    );
  }

  // Döngüsel Ekonomi:
  // İstenen kutular + Mevcut Dokümanlar: Söküm Talimatları, SDS
  // Hepsi "Veri mevcut değil" ve ikonlar YEŞİL OLMAYACAK (warn)
  function circularityHTML(d) {
    var c = d.circularity || {};
    var docs = c.documents || {};

    return (
      "<h2>Döngüsel Ekonomi</h2>" +
      '<div class="row">' +

        // sol
        '<div class="box" style="background:transparent;border:none;padding:0;margin:0;">' +
          '<div style="display:grid;gap:12px;">' +
            infoCard("Onarılabilirlik Skoru", c.repairability || "Veri mevcut değil") +
            infoCard("Geri Dönüşüm Bilgisi", c.recyclability || "Veri mevcut değil") +
            infoCard("Geri Dönüştürülmüş İçerik", c.recycledContent || "Veri mevcut değil") +
            infoCard("İkinci Ömür Uygunluğu", c.secondLife || "Veri mevcut değil") +
          "</div>" +
        "</div>" +

        // sağ
        '<div class="box">' +
          '<h3 style="display:flex;gap:8px;align-items:center;">' + icon("file-text") + "Mevcut Dökümanlar</h3>" +
          '<div style="display:grid;gap:10px;margin-top:10px;">' +
            '<div class="listItem">' +
              '<div>' +
                '<div style="font-weight:900;display:flex;gap:8px;align-items:center;">' + icon("check-circle") + "Söküm Talimatları</div>" +
                '<div class="small">' + esc(docs.dismantlingInstructions || "Veri mevcut değil") + "</div>" +
              "</div>" +
              pill("Veri mevcut değil", "warn") +
            "</div>" +
            '<div class="listItem">' +
              '<div>' +
                '<div style="font-weight:900;display:flex;gap:8px;align-items:center;">' + icon("check-circle") + "Güvenlik Veri Sayfası (SDS)</div>" +
                '<div class="small">' + esc(docs.sds || "Veri mevcut değil") + "</div>" +
              "</div>" +
              pill("Veri mevcut değil", "warn") +
            "</div>" +
          "</div>" +
        "</div>" +

      "</div>"
    );
  }

  // Uyumluluk:
  // - EU Battery Regulation / ESPR alt madde listeleri KALDIRILDI
  // - İstenen başlıklar: RoHS, REACH, CE, Test Raporu, Ürün Sertifikaları
  // - Test isimleri/sertifika isimleri görünmesin (sadece durum)
  function complianceHTML(d) {
    var c = d.compliance || {};

    function compTile(title, value) {
      var variant = statusVariant(value);
      var text = isMissing(value) ? "Veri mevcut değil" : value;
      return (
        '<div class="box">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;">' +
            '<h3 style="display:flex;gap:8px;align-items:center;margin:0;">' +
              icon("shield") +
              esc(title) +
            "</h3>" +
            pill(text, variant) +
          "</div>" +
        "</div>"
      );
    }

    return (
      "<h2>Düzenleyici Uyumluluk</h2>" +
      '<div class="row">' +
        compTile("RoHS", c.rohs) +
        compTile("REACH", c.reach) +
      "</div>" +
      '<div class="row" style="margin-top:12px;">' +
        compTile("CE", c.ce) +
        compTile("Test Raporu", c.testReport) +
      "</div>" +
      '<div class="row" style="margin-top:12px;">' +
        compTile("Ürün Sertifikaları", c.productCertificates) +
        '<div class="box"><div class="small">Not: Bu ekran demo amaçlıdır. Test/sertifika isimleri gösterilmez.</div></div>' +
      "</div>"
    );
  }

  // Dinamik Veriler (kamu da görür)
  function dynamicHTML(d) {
    var dyn = d.dynamicData || {};
    return (
      "<h2>Dinamik Veriler</h2>" +
      '<div class="row">' +
        infoCard("Performans Değerleri", dyn.performanceValues || "Veri mevcut değil") +
        infoCard("Sağlık Durumu (SoH)", dyn.soh || "Veri mevcut değil") +
      "</div>" +
      '<div class="row" style="margin-top:12px;">' +
        infoCard("Pil Statüsü", dyn.batteryStatus || "Veri mevcut değil") +
        infoCard("Kullanım Verileri", dyn.usageData || "Veri mevcut değil") +
      "</div>"
    );
  }

  // =========================
  // 6) Start
  // =========================
  state.data = normalizeData(DEFAULT);
  render();
  load();
})();
