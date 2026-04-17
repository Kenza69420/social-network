const form = document.getElementById("register-form");
const errorDiv = document.getElementById("register-error");
const successDiv = document.getElementById("register-success");
const ageInput = document.getElementById("age");
const ageError = document.getElementById("age-error");

ageInput.addEventListener("input", () => {
  if (ageInput.value && Number(ageInput.value) < 13) {
    ageError.classList.remove("hidden");
  } else {
    ageError.classList.add("hidden");
  }
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorDiv.classList.add("hidden");
  successDiv.classList.add("hidden");

  const age = Number(document.getElementById("age").value);
  if (age < 13) {
    ageError.classList.remove("hidden");
    return;
  }

  const formData = new FormData();
  formData.append("first_name", document.getElementById("first_name").value.trim());
  formData.append("last_name", document.getElementById("last_name").value.trim());
  formData.append("age", age);
  formData.append("gender", document.getElementById("gender").value);
  formData.append("username", document.getElementById("username").value.trim());
  formData.append("email", document.getElementById("email").value.trim());
  formData.append("password", document.getElementById("password").value);

  const photoFile = document.getElementById("profile_photo").files[0];
  if (photoFile) formData.append("profile_photo", photoFile);

  const res = await fetch("http://localhost:3000/api/auth/register", {
    method: "POST",
    body: formData,
  });

  const data = await res.json();

  if (!res.ok) {
    errorDiv.textContent = data.error;
    errorDiv.classList.remove("hidden");
    return;
  }

  successDiv.textContent = "Registration successful! Redirecting…";
  successDiv.classList.remove("hidden");
  form.reset();

  setTimeout(() => {
    window.location.href = "/";
  }, 1500);
});
