const token = localStorage.getItem("token");
if (!token) window.location.href = "/";

document.getElementById("logout-btn").addEventListener("click", () => {
  localStorage.clear(); window.location.href = "/";
});
document.getElementById("logout-btn-mobile").addEventListener("click", () => {
  localStorage.clear(); window.location.href = "/";
});
document.getElementById("nav-hamburger").addEventListener("click", () => {
  document.getElementById("nav-mobile-menu").classList.toggle("hidden");
});

function avatarSrc(url, name) {
  return url || `https://ui-avatars.com/api/?background=7c6cfc&color=fff&name=${encodeURIComponent(name || "U")}`;
}

async function loadUsers() {
  const container = document.getElementById("users-container");

  const res = await fetch("http://localhost:3000/api/users", {
    headers: { "Authorization": "Bearer " + token }
  });
  const data = await res.json();

  if (!res.ok) {
    container.innerHTML = '<div class="alert alert-error">Failed to load users.</div>';
    return;
  }

  if (data.length === 0) {
    container.innerHTML = "<p style='color:var(--text-muted)'>No users found.</p>";
    return;
  }

  const grid = document.createElement("div");
  grid.className = "users-grid";

  data.forEach(user => {
    const name = user.first_name + " " + user.last_name;
    const genderLabel = { male: "Male", female: "Female", other: "Other" }[user.gender] || user.gender;

    const a = document.createElement("a");
    a.className = "user-card";
    a.href = `/pages/user-detail.html?id=${user.id}`;
    a.innerHTML = `
      <img class="user-card-avatar" src="${avatarSrc(user.profile_photo, name)}" alt="${name}" />
      <div class="user-card-info">
        <div class="user-card-name">${name}</div>
        <div class="user-card-meta">${genderLabel}, ${user.age} years old</div>
        <div class="user-card-meta">${user.email}</div>
      </div>
    `;
    grid.appendChild(a);
  });

  container.innerHTML = "";
  container.appendChild(grid);
}

loadUsers();
