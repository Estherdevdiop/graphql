document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    const errorMessage = document.getElementById('error-message');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        const credentials = btoa(`${username}:${password}`);
       
        try {
            const response = await fetch('https://learn.zone01dakar.sn/api/auth/signin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${credentials}`
                },
                body: JSON.stringify({
                    provider: "username",
                    data: {
                        username: username,
                        password: password
                    }
                })
            });
    
            if (response.ok) {
                const data = await response.json();
                console.log("Réponse complète:", data);
                
                // Vérifiez si le JWT est bien présent et récupérez-le
                const jwt = data ; // Adaptez selon le champ correct
                if (jwt) {
                    document.body.innerHTML = ''
                    // document.body.innerHTML = 'je suis connecté'
                    localStorage.setItem('jwt', jwt);
                    console.log("JWT:", jwt);
                    window.location.href = 'profil.html';
                } else {
                    console.error("JWT non trouvé dans la réponse.");
                    errorMessage.textContent = 'Erreur lors de la connexion. Veuillez réessayer.';
                }
            } else {
                const errorData = await response.json();
                console.error("Erreur:", errorData);
                errorMessage.textContent = 'Identifiant ou mot de passe incorrect.';
            }
        } catch (error) {
            console.error("Erreur lors de la requête:", error);
            errorMessage.textContent = 'Une erreur est survenue. Veuillez réessayer.';
        }
    });
});
