const token = localStorage.getItem("token");
const currentUser = JSON.parse(localStorage.getItem("user") || "null");
if (!token) window.location.href = "/";

document.getElementById("logout-btn").addEventListener("click", () => {
  localStorage.clear();
  window.location.href = "/";
});
document.getElementById("logout-btn-mobile").addEventListener("click", () => {
  localStorage.clear();
  window.location.href = "/";
});
document.getElementById("nav-hamburger").addEventListener("click", () => {
  document.getElementById("nav-mobile-menu").classList.toggle("hidden");
});

const params = new URLSearchParams(window.location.search);
const userId = params.get("id");
if (!userId) window.location.href = "/pages/users.html";

function formatDate(str) {
  const d = new Date(str);
  return d.toLocaleDateString("en-GB") + " " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function avatarSrc(url, name) {
  return url || `https://ui-avatars.com/api/?background=7c6cfc&color=fff&name=${encodeURIComponent(name || "U")}`;
}

async function apiFetch(path, options = {}) {
  const headers = { "Content-Type": "application/json", "Authorization": "Bearer " + token };
  const res = await fetch("http://localhost:3000/api" + path, { ...options, headers });
  const data = await res.json();
  return { ok: res.ok, data };
}

function renderLikesList(container, likes) {
  if (likes.length === 0) {
    container.innerHTML = "<span>No likes yet</span>";
    return;
  }
  container.innerHTML = likes.map(l =>
    `<div class="like-item"><span>${l.first_name} ${l.last_name}</span><span>${formatDate(l.created_at)}</span></div>`
  ).join("");
}

function renderComments(container, comments, postId) {
  if (comments.length === 0) {
    container.innerHTML = "<p style='font-size:0.85rem;color:var(--text-muted);'>No comments yet</p>";
    return;
  }
  container.innerHTML = "";
  comments.forEach(c => {
    const name = c.first_name + " " + c.last_name;
    const div = document.createElement("div");
    div.className = "comment-item";
    div.innerHTML = `
      <img class="comment-avatar" src="${avatarSrc(c.profile_photo, name)}" alt="${name}" />
      <div class="comment-body">
        <span class="comment-author">${name}</span>
        <span class="comment-date">${formatDate(c.created_at)}</span>
        ${currentUser && c.user_id === currentUser.id ? `<button class="comment-delete" data-id="${c.id}">✕</button>` : ""}
        <p class="comment-text">${c.text}</p>
      </div>
    `;
    container.appendChild(div);
  });

  container.querySelectorAll(".comment-delete").forEach(btn => {
    btn.addEventListener("click", async () => {
      const { ok } = await apiFetch("/comments/" + btn.dataset.id, { method: "DELETE" });
      if (ok) {
        const { data } = await apiFetch("/posts/" + postId);
        renderComments(container, data.comments || [], postId);
      }
    });
  });
}

function renderPost(post) {
  const template = document.getElementById("post-template");
  const card = template.content.cloneNode(true);
  const authorName = post.first_name + " " + post.last_name;

  card.querySelector(".post-avatar").src = avatarSrc(post.profile_photo, authorName);
  card.querySelector(".post-avatar").alt = authorName;

  const authorLink = card.querySelector(".post-author");
  authorLink.textContent = authorName;
  authorLink.href = `/pages/user-detail.html?id=${post.user_id}`;

  card.querySelector(".post-date").textContent = formatDate(post.created_at);
  card.querySelector(".post-title").textContent = post.title;
  card.querySelector(".post-text").textContent = post.text;

  if (post.image) {
    const img = card.querySelector(".post-image");
    img.src = post.image;
    img.classList.remove("hidden");
  }

  const deleteBtn = card.querySelector(".post-delete");
  if (currentUser && post.user_id === currentUser.id) {
    deleteBtn.classList.remove("hidden");
    deleteBtn.addEventListener("click", async () => {
      if (!confirm("Delete this post?")) return;
      const { ok } = await apiFetch("/posts/" + post.id, { method: "DELETE" });
      if (ok) loadUserData();
    });
  }

  const likeBtn = card.querySelector(".btn-like");
  const likeCount = card.querySelector(".like-count");
  const likesList = card.querySelector(".likes-list");
  likeCount.textContent = post.like_count || 0;

  let userLiked = false;
  let likesData = [];

  apiFetch("/posts/" + post.id).then(({ data }) => {
    likesData = data.likes || [];
    userLiked = likesData.some(l => l.user_id === currentUser?.id);
    if (userLiked) likeBtn.classList.add("liked");
    renderComments(card.querySelector(".comments-list"), data.comments || [], post.id);
    card.querySelector(".comment-count-label").textContent = `${data.comments?.length || 0} comments`;
  });

  likeBtn.addEventListener("click", async () => {
    if (userLiked) {
      const { ok } = await apiFetch("/likes/" + post.id, { method: "DELETE" });
      if (ok) {
        userLiked = false;
        likeBtn.classList.remove("liked");
        likeCount.textContent = Number(likeCount.textContent) - 1;
      }
    } else {
      const { ok } = await apiFetch("/likes", { method: "POST", body: JSON.stringify({ post_id: post.id }) });
      if (ok) {
        userLiked = true;
        likeBtn.classList.add("liked");
        likeCount.textContent = Number(likeCount.textContent) + 1;
      }
    }
    if (!likesList.classList.contains("hidden")) {
      const { data } = await apiFetch("/posts/" + post.id);
      likesData = data.likes || [];
      renderLikesList(likesList, likesData);
    }
  });

  likeCount.style.cursor = "pointer";
  likeCount.addEventListener("click", async () => {
    if (likesList.classList.contains("hidden")) {
      const { data } = await apiFetch("/posts/" + post.id);
      likesData = data.likes || [];
      renderLikesList(likesList, likesData);
      likesList.classList.remove("hidden");
    } else {
      likesList.classList.add("hidden");
    }
  });

  const commentForm = card.querySelector(".comment-form");
  const commentInput = card.querySelector(".comment-input");
  commentForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = commentInput.value.trim();
    if (!text) return;
    const { ok } = await apiFetch("/comments", {
      method: "POST",
      body: JSON.stringify({ post_id: post.id, text }),
    });
    if (ok) {
      commentInput.value = "";
      const { data } = await apiFetch("/posts/" + post.id);
      renderComments(card.querySelector(".comments-list"), data.comments || [], post.id);
      card.querySelector(".comment-count-label").textContent = `${data.comments?.length || 0} comments`;
    }
  });

  return card;
}

async function loadUserData() {
  const { ok, data } = await apiFetch("/users/" + userId);

  if (!ok) {
    document.getElementById("user-profile").innerHTML = '<div class="alert alert-error">User not found.</div>';
    return;
  }

  const { user, own_posts, activity } = data;
  const name = user.first_name + " " + user.last_name;
  const genderLabel = { male: "Male", female: "Female", other: "Other" }[user.gender] || user.gender;

  document.title = `${name} – ZooNet`;

  document.getElementById("user-profile").innerHTML = `
    <img class="profile-avatar" src="${avatarSrc(user.profile_photo, name)}" alt="${name}" />
    <div class="profile-info">
      <h2>${name}</h2>
      <p>${genderLabel} · ${user.age} years old</p>
      <p>${user.email}</p>
      <p class="profile-joined">Member since ${new Date(user.created_at).toLocaleDateString("en-GB")}</p>
    </div>
  `;

  const ownContainer = document.getElementById("own-posts-container");
  if (own_posts.length === 0) {
    ownContainer.innerHTML = "<p style='color:var(--text-muted)'>No posts yet.</p>";
  } else {
    ownContainer.innerHTML = "";
    own_posts.forEach(post => ownContainer.appendChild(renderPost(post)));
  }

  const activityContainer = document.getElementById("activity-container");
  if (activity.length === 0) {
    activityContainer.innerHTML = "<p style='color:var(--text-muted)'>No activity yet.</p>";
  } else {
    activityContainer.innerHTML = "";
    activity.forEach(post => activityContainer.appendChild(renderPost(post)));
  }
}

loadUserData();
