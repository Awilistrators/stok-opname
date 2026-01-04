const API_URL = "https://script.google.com/macros/s/AKfycbyBo6zgFV0ULvGk--Ornhf_fhITK8KUCUSsD_91oNM5kz4Bmc2b_ZnKlNtCx67tuV-A/exec";

let masterProduk = {};
let masterReady = false; // ⬅️ TAMBAH
let qrScanner = null;
let kameraAktif = false;
let lastScan = "";
let lastScanTime = 0;


const petugas = localStorage.getItem("petugas");
const mode = localStorage.getItem("modeScan");

if(!petugas){
  location.href = "index.html";
}

/* ============================= */
/* ELEMENT DOM (WAJIB DULU)      */
/* ============================= */
const barcode = document.getElementById("barcode");
const qty = document.getElementById("qty");
const nama = document.getElementById("nama");
const status = document.getElementById("status");
const info = document.getElementById("info");
const qohEl = document.getElementById("qoh");

info.innerText = "Petugas: " + petugas;

/* ============================= */
/* LOAD MASTER PRODUK (SEKALI)   */
/* ============================= */
loadMasterProduk();

function loadMasterProduk(){
  status.innerText = "📦 Memuat data produk...";

  fetch(API_URL,{
    method: "POST",
    body: JSON.stringify({
      action: "getAllProduk"
    })
  })
  .then(r => r.json())
  .then(data => {
  masterProduk = data;
  masterReady = true; // ⬅️ PENTING
  status.innerText = "✅ Data produk siap";
  setTimeout(() => status.innerText = "", 1000);
})

  .catch(() => {
    status.innerText = "❌ Gagal memuat master produk";
  });
}

/* ============================= */
/* SCAN BARCODE                  */
/* ============================= */
let scanTimer = null;

// ENTER (scanner / keyboard)
barcode.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    e.preventDefault();
    cariProduk();
  }

  // TAB → tunggu browser selesai update value
  if (e.key === "Tab") {
    setTimeout(() => {
      cariProduk();
    }, 0);
  }
});

// HP & paste / kamera
barcode.addEventListener("input", () => {
  clearTimeout(scanTimer);
  scanTimer = setTimeout(() => {
    cariProduk();
  }, 300);
});

// SCANNER TAB (kehilangan fokus)
barcode.addEventListener("blur", () => {
  setTimeout(() => {
    cariProduk();
  }, 0);
});

function cariProduk(){
  const code = barcode.value.trim();
  if(!code) return;

  if(!masterReady){
    status.innerText = "⏳ Data produk belum siap...";
    return;
  }

  const produk = masterProduk[code];

  if(produk){
  nama.innerText = produk.nama;
  qohEl.innerText = "Stok sistem : " + produk.qoh;
  status.innerText = "✔ Produk ditemukan";
  bunyiBeep(); // 🔊 beep sukses

  // ⬇️ TAMBAHKAN INI
  qty.value = "";
  setTimeout(() => {
    qty.focus();
  }, 100);

} else {

    nama.innerText = "";
    qohEl.innerText = "";
    status.innerText = "⚠️ Produk tidak ditemukan";
  }
}


/* ============================= */
/* SIMPAN OPNAME                 */
/* ============================= */
function simpan(){

  // ❌ CEK BARCODE / KODE ITEM
  if(!barcode.value.trim()){
    tampilkanPopup("Scan / isi kode item dulu");
    return;
  }

  // ❌ CEK QTY
  if(!qty.value){
    tampilkanPopup("Qty wajib diisi");
    return;
  }

  // SIMPAN DATA KE VARIABEL
  const payload = {
    action: "simpanOpname",
    kode_input: barcode.value,
    nama: nama.innerText,
    qty: qty.value,
    petugas: petugas
  };

  // RESET UI LANGSUNG (INSTAN)
  barcode.value = "";
  qty.value = "";
  nama.innerText = "";
  qohEl.innerText = "";
  status.innerText = "💾 Tersimpan";
  resumeKamera();
  scrollKeKamera();


  setTimeout(() => {
    status.innerText = "";
  }, 500);

  // KIRIM API DI BACKGROUND
  fetch(API_URL,{
    method:"POST",
    body: JSON.stringify(payload)
  }).catch(() => {
    console.error("Gagal simpan opname");
  });
}


/* ============================= */
/* GANTI PETUGAS                 */
/* ============================= */
function ganti(){
  localStorage.clear();
  location.href = "index.html";
}

function bukaKamera(){
  const kameraDiv = document.getElementById("kamera");
  kameraDiv.style.display = "block";

  if(qrScanner) return;

  kameraAktif = true;
  qrScanner = new Html5Qrcode("kamera");

  qrScanner.start(
    { facingMode: "environment" },
    {
      fps: 10,
      formatsToSupport: [
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E
      ]
    },
    (decodedText) => {
      if(!kameraAktif) return;

      const now = Date.now();
if(decodedText === lastScan && now - lastScanTime < 1500) return;

lastScan = decodedText;
lastScanTime = now;

      barcode.value = decodedText;
bunyiBeep();
cariProduk();

// ⬇️ PAUSE kamera setelah scan sukses
pauseKamera();


      // ❌ JANGAN stop kamera
    },
    () => {}
  );
}

function matikanKamera(){
  const kameraDiv = document.getElementById("kamera");

  kameraAktif = false;

  if(qrScanner){
    qrScanner.stop().then(() => {
      qrScanner = null;
      kameraDiv.style.display = "none";
    });
  }
}



function bunyiBeep(){
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = "square";
    osc2.type = "triangle";

    osc1.frequency.value = 600;
    osc2.frequency.value = 1200;

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    gain.gain.value = 0.18;

    osc1.start();
    osc2.start();

    osc1.stop(ctx.currentTime + 0.08);
    osc2.stop(ctx.currentTime + 0.15);
  } catch(e) {}
}


function tampilkanPopup(teks){
  const popup = document.getElementById("popup");
  const popupText = document.getElementById("popup-text");

  if(!popup || !popupText){
    console.error("Popup tidak ditemukan");
    return;
  }

  popupText.innerText = teks;
  popup.classList.remove("hidden");
}

function tutupPopup(){
  const popup = document.getElementById("popup");
  if(popup){
    popup.classList.add("hidden");
  }
}

function pauseKamera(){
  kameraAktif = false;
}

function resumeKamera(){
  kameraAktif = true;
  lastScan = "";        // ⬅️ RESET BARCODE TERAKHIR
  lastScanTime = 0;
}

function scrollKeKamera(){
  const kameraDiv = document.getElementById("kamera");
  if(kameraDiv){
    kameraDiv.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }
}


