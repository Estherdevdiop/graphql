document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("jwt");
    if (!token) {
        window.location.href = "index.html";
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
            <p>Country: ${user.campus}</p>
           
        `;

        // Draw the horizontal bar chart for Total Down, Total Up, and Ratio
        drawHorizontalBarChart([user.totalDown, user.totalUp, user.auditRatio], ["Total Down", "Total Up", "Ratio"], 'horizontal-bar-chart');

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

        // Draw the bar chart
        drawBarChart(projectXP, projectNames, 'bar-chart');

        // Fetch skill data
        const skillData = await fetchGraphQL(token, `
            query {
                user {
                    transactions(where: {
                        type: {_ilike: "%skill%"}
                    }) {
                        type
                        amount
                    }
                }
            }
        `);

        if (!skillData || !skillData.user || skillData.user.length === 0) {
            throw new Error("No skill data found");
        }

        // Process skill data for chart
        var langSkills = {
            "Go": 0,
            "Js": 0,
            "Rust": 0,
            "Html": 0,
            "Css": 0,
            "Unix": 0,
            "Docker": 0,
            "Sql": 0,
            "C": 0
        };

        for (var i = 0; i < skillData.user[0].transactions.length; i++) {
            var skill = skillData.user[0].transactions[i].type.toLowerCase();
            var amount = skillData.user[0].transactions[i].amount;

            if (skill.includes("_go")) {
                langSkills["Go"] = Math.max(langSkills["Go"], amount);
            } else if (skill.includes("js")) {
                langSkills["Js"] = Math.max(langSkills["Js"], amount);
            } else if (skill.includes("rust")) {
                langSkills["Rust"] = Math.max(langSkills["Rust"], amount);
            } else if (skill.includes("html")) {
                langSkills["Html"] = Math.max(langSkills["Html"], amount);
            } else if (skill.includes("css")) {
                langSkills["Css"] = Math.max(langSkills["Css"], amount);
            } else if (skill.includes("unix")) {
                langSkills["Unix"] = Math.max(langSkills["Unix"], amount);
            } else if (skill.includes("docker")) {
                langSkills["Docker"] = Math.max(langSkills["Docker"], amount);
            } else if (skill.includes("sql")) {
                langSkills["Sql"] = Math.max(langSkills["Sql"], amount);
            } else if (skill.includes("_c")) {
                langSkills["C"] = Math.max(langSkills["C"], amount);
            }
        }

        const skills = Object.keys(langSkills);
        const skillValues = Object.values(langSkills);

        // Draw the pie chart
        drawPieChart(skillValues, skills, 'pie-chart');

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
        valueText.setAttribute('style', 'font-size: 10px;');
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
        text.setAttribute('style', 'font-size: 10px;');
        text.setAttribute('transform', `rotate(-45, ${x}, ${y})`);
        text.textContent = label.length > 15 ? label.substring(0, 12) + '...' : label;
        svg.appendChild(text);
    });
}

// Function to draw pie chart
function drawPieChart(data, labels, chartId) {
    const svg = document.getElementById(chartId);
    const width = svg.getAttribute('width');
    const height = svg.getAttribute('height');
    const radius = Math.min(width, height) / 2 - 40;

    const total = data.reduce((sum, value) => sum + value, 0);
    let startAngle = 0;

    const colors = ['#ff6384', '#36a2eb', '#cc65fe', '#ffce56', '#ffa600', '#00bfae', '#ff5722', '#8bc34a'];

    data.forEach((d, i) => {
        const sliceAngle = (d / total) * 2 * Math.PI;
        const endAngle = startAngle + sliceAngle;

        const x1 = width / 2 + radius * Math.cos(startAngle);
        const y1 = height / 2 - radius * Math.sin(startAngle);
        const x2 = width / 2 + radius * Math.cos(endAngle);
        const y2 = height / 2 - radius * Math.sin(endAngle);

        const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;

        const pathData = [
            `M ${width / 2} ${height / 2}`,
            `L ${x1} ${y1}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
            'Z'
        ].join(' ');

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathData);
        path.setAttribute('fill', colors[i % colors.length]);
        svg.appendChild(path);

        startAngle = endAngle;
    });

    // Add labels
    startAngle = 0;
    data.forEach((d, i) => {
        const sliceAngle = (d / total) * 2 * Math.PI;
        const endAngle = startAngle + sliceAngle;

        const x = width / 2 + (radius / 1.5) * Math.cos(startAngle + sliceAngle / 2);
        const y = height / 2 - (radius / 1.5) * Math.sin(startAngle + sliceAngle / 2);

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', x);
        text.setAttribute('y', y);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('fill', 'white');
        text.setAttribute('style', 'font-size: 10px;');
        text.textContent = `${labels[i]} (${d})`;
        svg.appendChild(text);

        startAngle = endAngle;
    });
}

// Function to draw horizontal bar chart
function drawHorizontalBarChart(data, labels, chartId) {
    const svg = document.getElementById(chartId);
    const width = svg.getAttribute('width');
    const height = svg.getAttribute('height');
    const padding = 20;
    const barHeight = (height - 2 * padding) / data.length;

    const maxDataValue = Math.max(...data);

    // Scale functions
    const xScale = (value) => padding + (value * (width - 2 * padding) / maxDataValue);
    const yScale = (index) => padding + (index * barHeight);

    // Draw bars
    data.forEach((d, i) => {
        const x = padding;
        const y = yScale(i);
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', x);
        rect.setAttribute('y', y);
        rect.setAttribute('width', xScale(d));
        rect.setAttribute('height', barHeight - 10);
        rect.setAttribute('fill', 'steelblue');
        rect.setAttribute('rx', '5'); // Rounded corners
        svg.appendChild(rect);

        // Add labels on the left of the bars
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', x - 5);
        text.setAttribute('y', y + (barHeight - 10) / 2 + 5);
        text.setAttribute('text-anchor', 'end');
        text.setAttribute('fill', 'white');
        text.setAttribute('style', 'font-size: 12px;');
        text.textContent = labels[i];
        svg.appendChild(text);

        // Add value labels on the right of the bars
        const valueText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        valueText.setAttribute('x', x + xScale(d) + 5);
        valueText.setAttribute('y', y + (barHeight - 10) / 2 + 5);
        valueText.setAttribute('text-anchor', 'start');
        valueText.setAttribute('fill', 'white');
        valueText.setAttribute('style', 'font-size: 12px;');
        valueText.textContent = formatValue(d, labels[i]);
        svg.appendChild(valueText);
    });
}

function formatValue(value, label) {
    if (label === "Ratio") {
        return value.toFixed(1);
    }
    if (value >= 1e6) {
        return (value / 1e6).toFixed(2) + ' MB';
    } else if (value >= 1e3) {
        return (value / 1e3).toFixed(2) + ' kB';
    }
    return value.toString();
}
