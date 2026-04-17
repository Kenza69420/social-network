if (localStorage.getItem("token")) {
  window.location.href = "/pages/wall.html";
}

const form = document.getElementById("login-form");
const errorDiv = document.getElementById("login-error");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorDiv.classList.add("hidden");

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  const res = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  const data = await res.json();

  if (!res.ok) {
    errorDiv.textContent = data.error;
    errorDiv.classList.remove("hidden");
    return;
  }

  localStorage.setItem("token", data.token);
  localStorage.setItem("user", JSON.stringify(data.user));
  window.location.href = "/pages/wall.html";
});
