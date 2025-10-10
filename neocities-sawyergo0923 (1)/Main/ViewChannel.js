// Main/ViewChannel.js
// Loads and displays a user's channel inside #contentArea
// Supports Firebase (compat) if it's available, otherwise falls back to localStorage.

// expose global loader so Main.html can call it whether this is loaded as a module or not
window.loadChannelFor = async function(viewUsername) {
  const contentArea = document.getElementById("contentArea");
  if (!contentArea) return console.error("No #contentArea found.");

  // If no username provided, use current logged-in user
  const currentUser = localStorage.getItem("userUsername");
  const username = viewUsername || currentUser;
  if (!username) {
    contentArea.innerHTML = "<h2>No user specified or logged in.</h2>";
    return;
  }

  // Basic skeleton for the channel UI
  contentArea.innerHTML = `
    <div style="max-width:1000px;margin:30px auto;color:#c6c3ff;text-align:left;">
      <div style="display:flex;align-items:center;gap:20px;">
        <img id="chanProfilePic" src="" alt="Profile" style="width:110px;height:110px;border-radius:50%;object-fit:cover;background:#7158ff;">
        <div>
          <div id="chanName" style="font-size:24px;font-weight:700;">${username}</div>
          <div id="chanMeta" style="opacity:0.8;margin-top:6px;">Channel • BlipTube</div>
        </div>
      </div>

      <div style="margin-top:20px; display:flex; gap:16px; align-items:center;">
        <div>
          <!-- only show upload control if current user === channel owner -->
          <div id="uploadControls"></div>
        </div>
      </div>

      <h3 style="margin-top:26px;color:#c6c3ff;">Uploads</h3>
      <div id="channelUploads" style="display:flex;flex-wrap:wrap;gap:12px;margin-top:12px;"></div>
    </div>
  `;

  const chanProfilePic = document.getElementById("chanProfilePic");
  const chanName = document.getElementById("chanName");
  const channelUploads = document.getElementById("channelUploads");
  const uploadControls = document.getElementById("uploadControls");

  // helper to render uploads (array of {title, dataURL, type, createdAt})
  function renderUploads(uploadObj) {
    channelUploads.innerHTML = "";
    if (!uploadObj) {
      channelUploads.textContent = "No uploads yet.";
      return;
    }
    // uploadObj can be object keyed by id or array
    const items = Array.isArray(uploadObj) ? uploadObj : Object.values(uploadObj || {});
    if (items.length === 0) {
      channelUploads.textContent = "No uploads yet.";
      return;
    }
    items.reverse(); // newest first
    for (const item of items) {
      const tile = document.createElement("div");
      tile.className = "uploadTile";
      tile.style.cssText = "width:220px;height:140px;background:#2a1e5e;border-radius:8px;padding:8px;display:flex;flex-direction:column;justify-content:center;align-items:center;overflow:hidden";
      if (item.dataURL && item.type && item.type.startsWith("image")) {
        const img = document.createElement("img");
        img.src = item.dataURL;
        img.style.cssText = "max-width:100%;max-height:100%;object-fit:cover;border-radius:6px;";
        tile.appendChild(img);
      } else {
        const title = document.createElement("div");
        title.textContent = item.title || "Upload";
        title.style.cssText = "text-align:center;padding:6px;color:#c6c3ff";
        tile.appendChild(title);
      }
      channelUploads.appendChild(tile);
    }
  }

  // Try Firebase if available (compat)
  const hasFirebase = (typeof window.firebase !== "undefined") && !!firebase.database;
  if (hasFirebase) {
    try {
      const db = firebase.database();
      // user stored under users/<username>
      const userRef = db.ref("users/" + username);
      const snap = await userRef.once("value");
      const userData = snap.exists() ? snap.val() : null;

      if (!userData) {
        chanName.textContent = username + " (not found)";
        chanProfilePic.src = "";
        channelUploads.textContent = "No uploads yet.";
      } else {
        chanName.textContent = userData.displayName || username;
        chanProfilePic.src = userData.profilePic || "";
        renderUploads(userData.uploads);
      }

      // If this viewer is the owner, show upload controls that save to Firebase
      if (username === currentUser) {
        uploadControls.innerHTML = `
          <input type="file" id="vcUploadInput" accept="image/*,video/*" style="display:none;">
          <button id="vcUploadBtn" style="padding:8px 12px;border-radius:6px;background:#7158ff;border:none;color:white;cursor:pointer">Upload</button>
          <input id="vcTitle" placeholder="Title (optional)" style="margin-left:8px;padding:6px;border-radius:6px;background:#3b2c7a;border:none;color:white;">
          <div id="vcStatus" style="margin-top:6px;color:#c6c3ff;"></div>
        `;
        const vcUploadInput = document.getElementById("vcUploadInput");
        const vcUploadBtn = document.getElementById("vcUploadBtn");
        const vcTitle = document.getElementById("vcTitle");
        const vcStatus = document.getElementById("vcStatus");

        vcUploadBtn.addEventListener("click", () => vcUploadInput.click());
        vcUploadInput.addEventListener("change", async () => {
          const file = vcUploadInput.files[0];
          if (!file) return;
          vcStatus.textContent = `Preparing "${file.name}"...`;
          // read as data URL (simple; for production use Storage)
          const reader = new FileReader();
          reader.onload = async () => {
            const dataURL = reader.result;
            const newUploadRef = db.ref("users/" + username + "/uploads").push();
            const payload = {
              title: vcTitle.value || file.name,
              type: file.type,
              dataURL,
              createdAt: Date.now()
            };
            try {
              await newUploadRef.set(payload);
              vcStatus.textContent = `Uploaded "${payload.title}"`;
              // refresh view
              const snap2 = await userRef.once("value");
              renderUploads(snap2.val()?.uploads);
            } catch (err) {
              console.error(err);
              vcStatus.textContent = "Upload failed.";
            }
          };
          reader.readAsDataURL(file);
        });
      } else {
        uploadControls.innerHTML = ""; // no controls for visitors
      }

      return;
    } catch (err) {
      console.error("Firebase error in ViewChannel:", err);
      // fallback to localStorage below
    }
  }

  // --- fallback: localStorage ---
  const users = JSON.parse(localStorage.getItem("users") || "{}");
  const udata = users[username];
  if (!udata) {
    chanName.textContent = username + " (not found)";
    chanProfilePic.src = "";
    channelUploads.textContent = "No uploads yet.";
    uploadControls.innerHTML = "";
    return;
  }

  chanName.textContent = udata.displayName || username;
  chanProfilePic.src = udata.profilePic || "";

  renderUploads(udata.uploads);

  // upload controls for owner (localStorage)
  if (username === currentUser) {
    uploadControls.innerHTML = `
      <input type="file" id="vcUploadInput" accept="image/*,video/*" style="display:none;">
      <button id="vcUploadBtn" style="padding:8px 12px;border-radius:6px;background:#7158ff;border:none;color:white;cursor:pointer">Upload</button>
      <input id="vcTitle" placeholder="Title (optional)" style="margin-left:8px;padding:6px;border-radius:6px;background:#3b2c7a;border:none;color:white;">
      <div id="vcStatus" style="margin-top:6px;color:#c6c3ff;"></div>
    `;
    const vcUploadInput = document.getElementById("vcUploadInput");
    const vcUploadBtn = document.getElementById("vcUploadBtn");
    const vcTitle = document.getElementById("vcTitle");
    const vcStatus = document.getElementById("vcStatus");

    vcUploadBtn.addEventListener("click", () => vcUploadInput.click());
    vcUploadInput.addEventListener("change", () => {
      const file = vcUploadInput.files[0];
      if (!file) return;
      vcStatus.textContent = `Preparing "${file.name}"...`;
      const reader = new FileReader();
      reader.onload = () => {
        const dataURL = reader.result;
        const uploadEntry = {
          title: vcTitle.value || file.name,
          type: file.type,
          dataURL,
          createdAt: Date.now()
        };
        users[username].uploads = users[username].uploads || [];
        users[username].uploads.push(uploadEntry);
        localStorage.setItem("users", JSON.stringify(users));
        vcStatus.textContent = `Uploaded "${uploadEntry.title}"`;
        renderUploads(users[username].uploads);
      };
      reader.readAsDataURL(file);
    });
  } else {
    uploadControls.innerHTML = ""; // visitor
  }
};