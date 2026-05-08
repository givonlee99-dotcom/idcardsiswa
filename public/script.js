const DRAFT_KEY = "cardDraft";
const DEVICE_KEY = "cardDeviceId";
const API_BASE = "/api";
const ADMIN_WA = "6282353730849";

let template = "";

function getDeviceId() {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

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

async function checkAccess() {
  const deviceId = getDeviceId();

  const res = await fetch(
    `${API_BASE}/lock?deviceId=${encodeURIComponent(deviceId)}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  const data = await res.json();

  if (!res.ok || !data.allowed) {
    throw new Error(
      data.message || "Perangkat ini tidak diizinkan. Hubungi admin."
    );
  }

  return true;
}

async function markUse() {
  const deviceId = getDeviceId();

  const res = await fetch(`${API_BASE}/lock/use`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ deviceId }),
  });

  const data = await res.json();

  if (!res.ok || !data.ok) {
    throw new Error(data.message || "Batas penggunaan habis.");
  }

  return data;
}

function showAccessDenied(message) {
  const formBox = document.getElementById("formBox");
  const preview = document.getElementById("preview");
  const denied = document.getElementById("accessDenied");
  const deniedText = document.getElementById("accessDeniedText");

  if (formBox) formBox.style.display = "none";
  if (preview) preview.style.display = "none";

  if (denied) denied.style.display = "block";
  if (deniedText) {
    deniedText.innerHTML =
      message +
      `<br><br>Silakan hubungi admin di WhatsApp: <strong>082353730849</strong>`;
  }
}

async function previewCard(draft = null) {
  const preview = document.getElementById("preview");
  const formBox = document.getElementById("formBox");
  const denied = document.getElementById("accessDenied");

  if (denied) denied.style.display = "none";
  if (formBox) formBox.style.display = "none";
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

  document.getElementById("sekolahCard").innerText = data.sekolah || "";
  document.getElementById("alamatCard").innerText = data.alamat || "";
  document.getElementById("namaCard").innerText = data.nama || "";
  document.getElementById("nisnCard").innerText = data.nisn || "";
  document.getElementById("alamatSiswaCard").innerText = data.alamatSiswa || "";
  document.getElementById("masaCard").innerText =
    "Berlaku Sampai : " + (data.masa || "");

  const card = document.getElementById("card");

  if (data.template) {
    card.style.backgroundImage = `url('${data.template}')`;
    card.style.backgroundSize = "cover";
    card.style.backgroundPosition = "center";
  }

  document.getElementById("qrCard").innerHTML = "";
  new QRCode(document.getElementById("qrCard"), {
    text: data.nisn || "",
    width: 60,
    height: 60,
  });

  const logoCard = document.getElementById("logoCard");
  if (data.logo) {
    logoCard.src = data.logo;
  } else {
    logoCard.removeAttribute("src");
  }

  const fotoCard = document.getElementById("fotoCard");
  if (data.foto) {
    fotoCard.src = data.foto;
  } else {
    fotoCard.removeAttribute("src");
  }

  setTimeout(() => {
    preview.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, 200);
}

async function handlePreview() {
  try {
    await checkAccess();
    const draft = await saveDraftWithImages();
    await previewCard(draft);
  } catch (err) {
    showAccessDenied(
      err.message ||
        "Perangkat ini sudah dipakai user lain. Hubungi admin untuk reset."
    );
  }
}

function downloadNow() {
  return new Promise((resolve, reject) => {
    const card = document.getElementById("card");

    html2canvas(card, {
      useCORS: true,
      backgroundColor: null,
      scale: 2,
    })
      .then((canvas) => {
        const link = document.createElement("a");
        link.download = "kartu-pelajar.png";
        link.href = canvas.toDataURL("image/png");
        link.click();
        resolve();
      })
      .catch(reject);
  });
}

async function downloadCard() {
  try {
    await checkAccess();
    await saveDraftWithImages();
    window.location.href = "https://link-hub.net/1314520/FXcWHggpmgCJ";
  } catch (err) {
    showAccessDenied(
      err.message ||
        "Perangkat ini sudah dipakai user lain. Hubungi admin untuk reset."
    );
  }
}

window.addEventListener("load", async () => {
  const params = new URLSearchParams(window.location.search);
  const hash = window.location.hash || "";
  const fromLinkvertise =
    params.get("download") === "1" ||
    params.get("hash") ||
    hash.includes("download=1") ||
    localStorage.getItem("afterLinkvertise") === "1";

  if (fromLinkvertise) {
    try {
      await checkAccess();

      const draft = loadDraft();

      if (draft) {
        fillFormFromDraft(draft);

        const formBox = document.getElementById("formBox");
        const previewBox = document.getElementById("preview");

        if (formBox) formBox.style.display = "none";
        if (previewBox) previewBox.style.display = "block";

        await previewCard(draft);

        localStorage.removeItem("afterLinkvertise");

        setTimeout(() => {
          (async () => {
            await downloadNow();
            await markUse();
            document.getElementById("card")?.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          })().catch((err) => {
            showAccessDenied(
              err.message ||
                "Perangkat ini sudah dipakai user lain. Hubungi admin untuk reset."
            );
          });
        }, 1400);
      }
    } catch (err) {
      showAccessDenied(
        err.message ||
          "Perangkat ini sudah dipakai user lain. Hubungi admin untuk reset."
      );
    }
  }
});
