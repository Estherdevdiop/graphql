document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("jwt");
    if (!token) {
      window.location.href = "index.html"; // redirige vers la page de connexion si pas de token
      return;
    }
  
    const userInfoDiv = document.getElementById("user-info");
  
    try {
      const response = await fetch("https://learn.zone01dakar.sn/api/graphql-engine/v1/graphql", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          query: `
            query {
              user {
                attrs
                email
                firstName
                lastName
                login
                totalDown
                totalUp
                campus
                auditRatio
              }
            }
          `
        })
      });
  
      const data = await response.json();
      console.log("Full API Response:", data); // Log the full response
  
      if (!data.data || !data.data.user || data.data.user.length === 0) {
        throw new Error("Data not found");
      }
  
      console.log("GraphQL Data", data.data);
  
      // Populate user info
      const user = data.data.user[0];
      userInfoDiv.innerHTML = `
        <h2>${user.login}</h2>
        <p>Email: ${user.email}</p>
        <p>First Name: ${user.firstName}</p>
        <p>Last Name: ${user.lastName}</p>
        <p>Total Down: ${user.totalDown}</p>
        <p>Total Up: ${user.totalUp}</p>
        <p>contry: ${user.campus}</p>
         <p>ratio: ${user.auditRatio}</p>
        
      `;
  
    } catch (error) {
      console.error(error);
      userInfoDiv.textContent = `Failed to load user data: ${error.message}`;
    }
  
    document.getElementById("logout").addEventListener("click", () => {
      localStorage.removeItem("jwt");
      window.location.href = "index.html";
    });
  });
  