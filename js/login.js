document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");
  const errorMessage = document.getElementById("error-message");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const credentials = btoa(`${username}:${password}`);
    const body = {
      username: username,
      password: password,
    };

    try {
      const response = await fetch(
        "https://learn.zone01dakar.sn/api/auth/signin",
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${credentials}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        throw new Error("Invalid credentials");
      }

      const data = await response.json();
      console.log("data", data);

      localStorage.setItem("jwt", data);
      console.log("token", data);
      window.location.href = "profile.html";
    } catch (error) {
      errorMessage.textContent = error.message;
    }
  });
});
