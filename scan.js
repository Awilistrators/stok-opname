const API_URL = "https://script.google.com/macros/s/AKfycbwkmXgryVVSfP7EuLRlQ7c00SJ0Pb-yXic4lJPVNP20UzBFCBY2F7oSmkE5vO75Ioay/exec";

let masterProduk = {};   // ⬅️ cache MASTER_PRODUK
const petugas = localStorage.getItem("petugas");
const mode = localStorage.getItem("modeScan");

if(!petugas){
  location.href = "index.html";
}

document.getElementById("info").innerText =
  "Petugas: " + petugas + " | Mode: " + mode;

loadMasterProduk(); // ⬅️ PENTING: load master sekali

const barcode = document.getElementById("barcode");
const qty = document.getElementById("qty");
const nama = document.getElementById("nama");
const status = document.getElementById("status");

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
    masterProduk = data; // simpan ke memory
    status.innerText = "✅ Data produk siap";
    setTimeout(() => status.innerText = "", 1000);
  })
  .catch(() => {
    status.innerText = "❌ Gagal memuat master produk";
  });
}

// SCAN DENGAN SCANNER USB (ENTER)
barcode.addEventListener("keydown", e => {
  if(e.key === "Enter"){
    e.preventDefault();
    cariProduk();
  }
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

function simpan(){
  if(!qty.value){ alert("Qty wajib diisi"); return; }

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

function ganti(){
  localStorage.clear();
  location.href = "index.html";
}
