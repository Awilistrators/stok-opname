const API_URL = "https://script.google.com/macros/s/AKfycbxWygSWb3Xdafmp3L_1_b3BBx-2Vqnp3-pS5NT4JJPO2k0XJmMflIrrOFKQJU00Bvrp/exec";

let masterProduk = {};   // cache MASTER_PRODUK

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

info.innerText = "Petugas: " + petugas + " | Mode: " + mode;

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

barcode.addEventListener("keydown", e => {
  if (e.key === "Enter" || e.key === "Tab") {
    e.preventDefault();
    cariProduk();
  }
});

// Untuk HP & input manual
barcode.addEventListener("input", () => {
  clearTimeout(scanTimer);
  scanTimer = setTimeout(() => {
    cariProduk();
  }, 300); // tunggu user selesai input
});


function cariProduk(){
  const code = barcode.value.trim();
  if(!code) return;

  if(masterProduk[code]){
    nama.innerText = masterProduk[code];
    status.innerText = "";
    qty.focus();
  } else {
    nama.innerText = "";
    status.innerText = "⚠️ Produk tidak ditemukan";
    barcode.focus();
  }
}

/* ============================= */
/* SIMPAN OPNAME                 */
/* ============================= */
function simpan(){
  if(!qty.value){ 
    alert("Qty wajib diisi"); 
    return; 
  }

  fetch(API_URL,{
    method:"POST",
    body: JSON.stringify({
      action:"simpanOpname",
      barcode: barcode.value,
      nama: nama.innerText,
      qty: qty.value,
      petugas: petugas
    })
  })
  .then(r=>r.json())
  .then(()=>{
    barcode.value="";
    qty.value="";
    nama.innerText="";
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
