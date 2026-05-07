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

/* convert file -> base64 */
function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;

    reader.readAsDataURL(file);
  });
}

/* ambil data form */
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

/* simpan draft + gambar */
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

/* load draft */
function loadDraft() {
  const raw = localStorage.getItem(DRAFT_KEY);

  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

/* isi ulang form */
function fillFormFromDraft(draft) {
  document.getElementById("sekolah").value =
    draft.sekolah || "";

  document.getElementById("alamat").value =
    draft.alamat || "";

  document.getElementById("nama").value =
    draft.nama || "";

  document.getElementById("nisn").value =
    draft.nisn || "";

  document.getElementById("alamatSiswa").value =
    draft.alamatSiswa || "";

  document.getElementById("masa").value =
    draft.masa || "";

  template = draft.template || "";
}

/* preview kartu */
async function previewCard(draft = null) {

  const preview = document.getElementById("preview");

  preview.style.display = "block";

  const data =
    draft ||
    loadDraft() || {
      sekolah: "",
      alamat: "",
      nama: "",
      nisn: "",
      alamatSiswa: "",
      masa: "",
      template: "",
      logo: "",
      foto: "",
    };

  /* text */
  document.getElementById("sekolahCard").innerText =
    data.sekolah || "";

  document.getElementById("alamatCard").innerText =
    data.alamat || "";

  document.getElementById("namaCard").innerText =
    data.nama || "";

  document.getElementById("nisnCard").innerText =
    data.nisn || "";

  document.getElementById("alamatSiswaCard").innerText =
    data.alamatSiswa || "";

  document.getElementById("masaCard").innerText =
    "Berlaku Sampai : " + (data.masa || "");

  /* template */
  const card = document.getElementById("card");

  if (data.template) {
    card.style.backgroundImage =
      `url('${data.template}')`;

    card.style.backgroundSize = "cover";
    card.style.backgroundPosition = "center";
  }

  /* QR */
  document.getElementById("qrCard").innerHTML = "";

  new QRCode(document.getElementById("qrCard"), {
    text: data.nisn || "",
    width: 60,
    height: 60,
  });

  /* logo */
  const logoCard =
    document.getElementById("logoCard");

  if (data.logo) {
    logoCard.src = data.logo;
  } else {
    logoCard.removeAttribute("src");
  }

  /* foto */
  const fotoCard =
    document.getElementById("fotoCard");

  if (data.foto) {
    fotoCard.src = data.foto;
  } else {
    fotoCard.removeAttribute("src");
  }

  /* scroll ke preview */
  setTimeout(() => {
    preview.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, 200);
}

/* download */
function downloadNow() {

  const card =
    document.getElementById("card");

  html2canvas(card, {
    useCORS: true,
    backgroundColor: null,
    scale: 2,
  }).then((canvas) => {

    const link =
      document.createElement("a");

    link.download = "kartu-pelajar.png";

    link.href =
      canvas.toDataURL("image/png");

    link.click();
  });
}

/* tombol download */
async function downloadCard() {

  await saveDraftWithImages();

  /* redirect ke linkvertise */
  window.location.href =
    "https://link-hub.net/1314520/FXcWHggpmgCJ";
}

/* balik dari linkvertise */
window.addEventListener("load", async () => {

  const params =
    new URLSearchParams(window.location.search);

  /* kalau datang dari linkvertise */
  if (params.get("download") === "1") {

    const draft = loadDraft();

    if (draft) {

      /* isi ulang */
      fillFormFromDraft(draft);

      /* sembunyikan form */
      const formBox =
        document.getElementById("formBox");

      if (formBox) {
        formBox.style.display = "none";
      }

      /* tampilkan preview */
      const preview =
        document.getElementById("preview");

      if (preview) {
        preview.style.display = "block";
      }

      /* render ulang kartu */
      await previewCard(draft);

      /* tunggu render */
      setTimeout(() => {

        document
          .getElementById("card")
          ?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });

        /* auto download */
        downloadNow();

      }, 1400);
    }
  }
});
