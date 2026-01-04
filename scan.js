const API_URL = "https://script.google.com/macros/s/AKfycbyBo6zgFV0ULvGk--Ornhf_fhITK8KUCUSsD_91oNM5kz4Bmc2b_ZnKlNtCx67tuV-A/exec";

let masterProduk = {};
let masterReady = false; // ⬅️ TAMBAH
let qrScanner = null;

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
  barcode.focus();

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
      barcode.value = decodedText;
      bunyiBeep();
      qrScanner.stop();
      qrScanner = null;
      kameraDiv.style.display = "none";
      cariProduk();
    },
    () => {}
  );
}


function bunyiBeep(){
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";        // suara halus
    osc.frequency.value = 880; // nada beep (Hz)

    osc.connect(gain);
    gain.connect(ctx.destination);

    gain.gain.value = 0.15;   // volume (0.1–0.2 ideal)

    osc.start();
    osc.stop(ctx.currentTime + 0.12); // durasi beep (detik)
  } catch(e) {
    console.log("Audio tidak diizinkan");
  }
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
