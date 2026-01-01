const API_URL = "https://script.google.com/macros/s/AKfycbwkmXgryVVSfP7EuLRlQ7c00SJ0Pb-yXic4lJPVNP20UzBFCBY2F7oSmkE5vO75Ioay/exec";

const petugas = localStorage.getItem("petugas");
const mode = localStorage.getItem("modeScan");

if(!petugas){
  location.href = "index.html";
}

document.getElementById("info").innerText =
  "Petugas: " + petugas + " | Mode: " + mode;

const barcode = document.getElementById("barcode");
const qty = document.getElementById("qty");
const nama = document.getElementById("nama");
const status = document.getElementById("status");

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

  status.innerText = "🔍 Mencari produk...";
  nama.innerText = "";

  fetch(API_URL,{
    method:"POST",
    body: JSON.stringify({
      action:"getProduk",
      barcode: code
    })
  })
  .then(r=>r.json())
  .then(d=>{
    if(d.status !== "ok"){
      status.innerText = "⚠️ Produk tidak ditemukan";
      barcode.focus();
      return;
    }

    nama.innerText = d.nama;
    status.innerText = "";
    qty.focus();
  })
  .catch(()=>{
    status.innerText = "❌ Gagal koneksi";
  });
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
