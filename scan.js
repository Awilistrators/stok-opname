const API_URL = "https://script.google.com/macros/s/AKfycbxcYu3mJ7ezxrZmzuAQcIEjflqXLGLZBDuH0Y2ifJ29rjp6zkpEAO1gZ84XPGPzhOHE/exec";

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
    // ⛔ tidak auto pindah ke qty
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
  if(!qty.value){
    tampilkanPopup("Qty wajib diisi");
    return;
  }

  fetch(API_URL,{
    method:"POST",
    body: JSON.stringify({
      action: "simpanOpname",
      kode_input: barcode.value,   // bisa kode item / barcode
      nama: nama.innerText,
      qty: qty.value,
      petugas: petugas
    })
  })
  .then(r => r.json())
  .then(() => {
    barcode.value = "";
    qty.value = "";
    nama.innerText = "";
    qohEl.innerText = "";
    status.innerText = "";
    barcode.focus();
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
    { fps: 10, qrbox: 250 },
    (decodedText) => {
      barcode.value = decodedText;
      qrScanner.stop();
      qrScanner = null;
      kameraDiv.style.display = "none";
      cariProduk();
    },
    () => {}
  ).catch(err => {
    status.innerText = "❌ Kamera tidak bisa diakses";
  });
}

qty.focus();
