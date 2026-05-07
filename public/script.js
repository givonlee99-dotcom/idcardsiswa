const DRAFT_KEY = "cardDraft";
let template = "";

/* pilih template */
function selectTemplate(img) {
  template = img.src;

  document.querySelectorAll(".template img").forEach((i) => {
    i.style.border = "2px solid transparent";
  });

  img.style.border = "3px solid red";
}

function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getDraftFromForm() {
  return {
    sekolah: document.getElementById("sekolah").value,
    alamat: document.getElementById("alamat").value,
    nama: document.getElementById("nama").value,
    nisn: document.getElementById("nisn").value,
    alamatSiswa: document.getElementById("alamatSiswa").value,
    masa: document.getElementById("masa").value,
    template: template,
  };
}

async function saveDraftWithImages() {
  const draft = getDraftFromForm();

  const logoFile = document.getElementById("logo").files[0];
  const fotoFile = document.getElementById("foto").files[0];

  if (logoFile) {
    draft.logo = await fileToDataURL(logoFile);
  }

  if (fotoFile) {
    draft.foto = await fileToDataURL(fotoFile);
  }

  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  return draft;
}

function loadDraft() {
  const raw = localStorage.getItem(DRAFT_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function fillFormFromDraft(draft) {
  document.getElementById("sekolah").value = draft.sekolah || "";
  document.getElementById("alamat").value = draft.alamat || "";
  document.getElementById("nama").value = draft.nama || "";
  document.getElementById("nisn").value = draft.nisn || "";
  document.getElementById("alamatSiswa").value = draft.alamatSiswa || "";
  document.getElementById("masa").value = draft.masa || "";

  template = draft.template || "";
}

/* preview kartu */
async function previewCard(draft = null) {
  document.getElementById("preview").style.display = "block";

  document.getElementById("sekolahCard").innerText =
    document.getElementById("sekolah").value;

  document.getElementById("alamatCard").innerText =
    document.getElementById("alamat").value;

  document.getElementById("namaCard").innerText =
    document.getElementById("nama").value;

  document.getElementById("nisnCard").innerText =
    document.getElementById("nisn").value;

  document.getElementById("alamatSiswaCard").innerText =
    document.getElementById("alamatSiswa").value;

  document.getElementById("masaCard").innerText =
    "Berlaku Sampai : " + document.getElementById("masa").value;

  /* pasang template */
  if (template) {
    document.getElementById("card").style.backgroundImage =
      "url('" + template + "')";
    document.getElementById("card").style.backgroundSize = "cover";
  }

  /* QR CODE */
  document.getElementById("qrCard").innerHTML = "";
  new QRCode(document.getElementById("qrCard"), {
    text: document.getElementById("nisn").value,
    width: 60,
    height: 60,
  });

  /* logo */
  const logoCard = document.getElementById("logoCard");
  const logoFile = document.getElementById("logo").files[0];

  if (draft && draft.logo) {
    logoCard.src = draft.logo;
  } else if (logoFile) {
    const reader = new FileReader();
    reader.onload = function (e) {
      logoCard.src = e.target.result;
    };
    reader.readAsDataURL(logoFile);
  }

  /* foto siswa */
  const fotoCard = document.getElementById("fotoCard");
  const fotoFile = document.getElementById("foto").files[0];

  if (draft && draft.foto) {
    fotoCard.src = draft.foto;
  } else if (fotoFile) {
    const reader = new FileReader();
    reader.onload = function (e) {
      fotoCard.src = e.target.result;
    };
    reader.readAsDataURL(fotoFile);
  }
}

/* download langsung */
function downloadNow() {
  html2canvas(document.getElementById("card")).then((canvas) => {
    const link = document.createElement("a");
    link.download = "kartu.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  });
}

/* tombol download */
async function downloadCard() {
  await saveDraftWithImages();

  /* ganti dengan linkvertise kamu */
  window.location.href = "https://link-hub.net/1314520/FXcWHggpmgCJ";

  /* penting:
     di dashboard Linkvertise, set DESTINATION / target URL ke:
     https://domainkamu.com/?download=1
  */
}

/* saat balik dari Linkvertise */
window.addEventListener("load", async () => {
  const params = new URLSearchParams(window.location.search);

  if (params.get("download") === "1") {
    const draft = loadDraft();

    if (draft) {
      fillFormFromDraft(draft);
      await previewCard(draft);

      setTimeout(() => {
        downloadNow();
      }, 700);
    }
  }
});
