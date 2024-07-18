document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("jwt");
    if (!token) {
        window.location.href = "index.html"; // redirige vers la page de connexion si pas de token
        return;
    }

    const userInfoDiv = document.getElementById("user-info");

    try {
        const userData = await fetchGraphQL(token, `
            query {
                user {
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
        `);

        if (!userData || !userData.user || userData.user.length === 0) {
            throw new Error("Data not found");
        }

        const user = userData.user[0];
        userInfoDiv.innerHTML = `
            <h2>${user.login}</h2>
            <p>Email: ${user.email}</p>
            <p>First Name: ${user.firstName}</p>
            <p>Last Name: ${user.lastName}</p>
            <p>Total Down: ${user.totalDown}</p>
            <p>Total Up: ${user.totalUp}</p>
            <p>Country: ${user.campus}</p>
            <p>Ratio: ${user.auditRatio}</p>
        `;

        // Fetch project data
        const projectData = await fetchGraphQL(token, `
            query {
                transaction(where: {type: {_eq: "xp"}, object: {type: {_eq: "project"}}}) {
                    amount
                    object {
                        id
                        name
                    }
                }
            }
        `);

        if (!projectData || !projectData.transaction || projectData.transaction.length === 0) {
            throw new Error("No project data found");
        }

        // Process project data for chart
        const projectNames = projectData.transaction.map(tx => tx.object.name);
        const projectXP = projectData.transaction.map(tx => tx.amount);

        // Draw the chart
        drawBarChart(projectXP, projectNames, 'chart');

    } catch (error) {
        console.error(error);
        userInfoDiv.textContent = `Failed to load user data: ${error.message}`;
    }

    document.getElementById("logout").addEventListener("click", () => {
        localStorage.removeItem("jwt");
        window.location.href = "index.html";
    });
});

async function fetchGraphQL(token, query) {
    const response = await fetch("https://learn.zone01dakar.sn/api/graphql-engine/v1/graphql", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ query })
    });

    const result = await response.json();
    return result.data;
}

// Function to draw bar chart
function drawBarChart(data, labels, chartId) {
    const svg = document.getElementById(chartId);
    const width = svg.getAttribute('width');
    const height = svg.getAttribute('height');
    const padding = 40;
    const barWidth = (width - 2 * padding) / data.length;

    const maxDataValue = Math.max(...data);

    // Scale functions
    const xScale = (index) => padding + (index * barWidth);
    const yScale = (value) => height - padding - (value * (height - 2 * padding) / maxDataValue);

    // Draw axes
    const drawLine = (x1, y1, x2, y2, color = 'white') => {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', x1);
        line.setAttribute('y1', y1);
        line.setAttribute('x2', x2);
        line.setAttribute('y2', y2);
        line.setAttribute('stroke', color);
        svg.appendChild(line);
    };

    drawLine(padding, height - padding, width - padding, height - padding); // x-axis
    drawLine(padding, padding, padding, height - padding); // y-axis

    // Function to format XP values
    const formatXP = (value) => {
        if (value >= 1000) {
            return (value / 1000).toFixed(1) + 'k';
        }
        return value.toString();
    };

    // Draw bars
    data.forEach((d, i) => {
        const x = xScale(i);
        const y = yScale(d);
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', x);
        rect.setAttribute('y', y);
        rect.setAttribute('width', barWidth - 10);
        rect.setAttribute('height', height - padding - y);
        rect.setAttribute('fill', 'steelblue');
        rect.setAttribute('rx', '5'); // Rounded corners
        svg.appendChild(rect);

        // Add value labels on top of the bars
        const valueText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        valueText.setAttribute('x', x + (barWidth - 10) / 2);
        valueText.setAttribute('y', y - 10);
        valueText.setAttribute('text-anchor', 'middle');
        valueText.setAttribute('fill', 'white');
        valueText.setAttribute('transform', `rotate(-45, ${x + (barWidth - 10) / 2}, ${y - 10})`);
        valueText.textContent = formatXP(d);
        svg.appendChild(valueText);
    });

    // Add labels
    labels.forEach((label, i) => {
        const x = xScale(i) + (barWidth - 10) / 2;
        const y = height - padding + 20;
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', x);
        text.setAttribute('y', y);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('fill', 'white');
        text.setAttribute('style', 'font-size: 12px;');
        text.setAttribute('transform', `rotate(-45, ${x}, ${y})`);
        text.textContent = label.length > 15 ? label.substring(0, 12) + '...' : label;
        svg.appendChild(text);
    });
}
