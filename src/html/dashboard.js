export const dashboard_html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NEET PG Tracker - Dashboard</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.7.1/chart.min.js"></script>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        h1, h2 {
            text-align: center;
        }
        .nav {
            text-align: center;
            margin-bottom: 20px;
        }
        .nav a {
            margin: 0 10px;
            text-decoration: none;
            color: #333;
            font-weight: bold;
        }
        .chart-container {
            margin-bottom: 40px;
        }
        .ranking-container {
            margin-bottom: 40px;
        }
        .subject-ranking {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        .subject-ranking th, .subject-ranking td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        .subject-ranking th {
            background-color: #f2f2f2;
        }
        .subject-ranking tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        .subject-ranking tr:hover {
            background-color: #f1f1f1;
        }
        .trend-indicator {
            font-weight: bold;
            padding: 2px 5px;
            border-radius: 3px;
        }
        .trend-up {
            color: green;
        }
        .trend-down {
            color: red;
        }
        .trend-neutral {
            color: gray;
        }
        .subject-trends {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: 20px;
        }
        .loading {
            text-align: center;
            font-style: italic;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="nav">
        <a href="/">Input Form</a>
        <a href="/dashboard">Dashboard</a>
    </div>
    
    <h1>NEET PG Performance Dashboard</h1>
    
    <div id="loading" class="loading">Loading data...</div>
    
    <div id="dashboard-content" style="display: none;">
        <div class="ranking-container">
            <h2>Subject Rankings by Latest Percentile</h2>
            <table class="subject-ranking" id="subject-ranking-table">
                <thead>
                    <tr>
                        <th>Rank</th>
                        <th>Subject</th>
                        <th>Latest Percentile</th>
                        <th>Trend</th>
                        <th>Avg. Percentile</th>
                    </tr>
                </thead>
                <tbody id="subject-ranking-body">
                    <!-- Subject rankings will be populated here -->
                </tbody>
            </table>
        </div>
        
        <div class="chart-container">
            <h2>Overall Performance Trend</h2>
            <canvas id="overall-trend-chart"></canvas>
        </div>
        
        <h2>Subject-wise Performance Trends</h2>
        <div class="subject-trends" id="subject-trends-container">
            <!-- Subject-wise trend charts will be populated here -->
        </div>
    </div>
    
    <script>
        // Constants
        const subjects = [
            "Anatomy", "Physiology", "Biochemistry", "Pathology", "Microbiology", 
            "Pharmacology", "Forensic Medicine", "Community Medicine", "ENT", 
            "Ophthalmology", "Medicine", "Surgery", "Obstetrics & Gynecology", 
            "Pediatrics", "Dermatology", "Psychiatry", "Orthopedics", "Anesthesia", "Radiology"
        ];
        
        // Colors for charts
        const colors = [
            '#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b',
            '#6f42c1', '#fd7e14', '#20c9a6', '#858796', '#5a5c69',
            '#2e59d9', '#17a673', '#2c9faf', '#f4b619', '#e02d1b',
            '#5603ad', '#e8590c', '#13855c', '#60616f'
        ];
        
        // Fetch all test data
        async function fetchData() {
            try {
                const response = await fetch('/api/get-all-data');
                if (!response.ok) {
                    throw new Error('Failed to fetch data');
                }
                return await response.json();
            } catch (error) {
                console.error('Error fetching data:', error);
                return [];
            }
        }
        
        // Process data by subject
        function processDataBySubject(data) {
            const subjectData = {};
            
            // Initialize subject data
            subjects.forEach(subject => {
                subjectData[subject] = {
                    dates: [],
                    percentiles: [],
                    latestPercentile: 0,
                    avgPercentile: 0,
                    trend: 'neutral'
                };
            });
            
            // Group data by subject
            data.forEach(record => {
                const subject = record.subject;
                if (subjectData[subject]) {
                    subjectData[subject].dates.push(record.test_date);
                    subjectData[subject].percentiles.push(record.percentile);
                }
            });
            
            // Calculate latest percentile, average, and trend for each subject
            subjects.forEach(subject => {
                const subjectInfo = subjectData[subject];
                
                if (subjectInfo.percentiles.length > 0) {
                    // Sort data by date
                    const sortedIndices = subjectInfo.dates
                        .map((date, index) => ({ date, index }))
                        .sort((a, b) => new Date(a.date) - new Date(b.date))
                        .map(item => item.index);
                    
                    subjectInfo.dates = sortedIndices.map(i => subjectInfo.dates[i]);
                    subjectInfo.percentiles = sortedIndices.map(i => subjectInfo.percentiles[i]);
                    
                    // Get latest percentile
                    subjectInfo.latestPercentile = subjectInfo.percentiles[subjectInfo.percentiles.length - 1];
                    
                    // Calculate average percentile
                    subjectInfo.avgPercentile = subjectInfo.percentiles.reduce((sum, val) => sum + val, 0) / subjectInfo.percentiles.length;
                    
                    // Calculate trend (based on last 2-3 entries)
                    if (subjectInfo.percentiles.length >= 3) {
                        const lastThree = subjectInfo.percentiles.slice(-3);
                        if (lastThree[2] > lastThree[1] && lastThree[1] >= lastThree[0]) {
                            subjectInfo.trend = 'up';
                        } else if (lastThree[2] < lastThree[1] && lastThree[1] <= lastThree[0]) {
                            subjectInfo.trend = 'down';
                        }
                    } else if (subjectInfo.percentiles.length === 2) {
                        if (subjectInfo.percentiles[1] > subjectInfo.percentiles[0]) {
                            subjectInfo.trend = 'up';
                        } else if (subjectInfo.percentiles[1] < subjectInfo.percentiles[0]) {
                            subjectInfo.trend = 'down';
                        }
                    }
                }
            });
            
            return subjectData;
        }
        
        // Render subject rankings table
        function renderSubjectRankings(subjectData) {
            const tableBody = document.getElementById('subject-ranking-body');
            tableBody.innerHTML = '';
            
            // Sort subjects by latest percentile (descending)
            const sortedSubjects = subjects
                .filter(subject => subjectData[subject].percentiles.length > 0)
                .sort((a, b) => subjectData[b].latestPercentile - subjectData[a].latestPercentile);
            
            sortedSubjects.forEach((subject, index) => {
                const subjectInfo = subjectData[subject];
                const row = document.createElement('tr');
                
                // Rank
                const rankCell = document.createElement('td');
                rankCell.textContent = index + 1;
                row.appendChild(rankCell);
                
                // Subject
                const subjectCell = document.createElement('td');
                subjectCell.textContent = subject;
                row.appendChild(subjectCell);
                
                // Latest Percentile
                const percentileCell = document.createElement('td');
                percentileCell.textContent = subjectInfo.latestPercentile.toFixed(2);
                row.appendChild(percentileCell);
                
                // Trend
                const trendCell = document.createElement('td');
                const trendIndicator = document.createElement('span');
                trendIndicator.className = 'trend-indicator trend-' + subjectInfo.trend;
                
                if (subjectInfo.trend === 'up') {
                    trendIndicator.textContent = '↑ Improving';
                } else if (subjectInfo.trend === 'down') {
                    trendIndicator.textContent = '↓ Declining';
                } else {
                    trendIndicator.textContent = '→ Stable';
                }
                
                trendCell.appendChild(trendIndicator);
                row.appendChild(trendCell);
                
                // Average Percentile
                const avgCell = document.createElement('td');
                avgCell.textContent = subjectInfo.avgPercentile.toFixed(2);
                row.appendChild(avgCell);
                
                tableBody.appendChild(row);
            });
        }
        
        // Render overall performance trend chart
        function renderOverallTrendChart(subjectData) {
            // Get all unique dates across all subjects
            const allDates = new Set();
            subjects.forEach(subject => {
                subjectData[subject].dates.forEach(date => allDates.add(date));
            });
            
            // Sort dates
            const sortedDates = Array.from(allDates).sort((a, b) => new Date(a) - new Date(b));
            
            // Calculate average percentile for each date
            const datePercentiles = sortedDates.map(date => {
                let totalPercentile = 0;
                let count = 0;
                
                subjects.forEach(subject => {
                    const dateIndex = subjectData[subject].dates.indexOf(date);
                    if (dateIndex !== -1) {
                        totalPercentile += subjectData[subject].percentiles[dateIndex];
                        count++;
                    }
                });
                
                return count > 0 ? totalPercentile / count : 0;
            });
            
            // Format dates for display
            const formattedDates = sortedDates.map(date => {
                const d = new Date(date);
                return d.getDate() + '/' + (d.getMonth() + 1) + '/' + d.getFullYear();
            });
            
            // Create chart
            const ctx = document.getElementById('overall-trend-chart').getContext('2d');
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: formattedDates,
                    datasets: [{
                        label: 'Average Percentile',
                        data: datePercentiles,
                        borderColor: '#4e73df',
                        backgroundColor: 'rgba(78, 115, 223, 0.1)',
                        borderWidth: 2,
                        pointRadius: 3,
                        fill: true,
                        tension: 0.1
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Overall Performance Trend'
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            title: {
                                display: true,
                                text: 'Percentile'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Test Date'
                            }
                        }
                    }
                }
            });
        }
        
        // Render subject-wise trend charts
        function renderSubjectTrendCharts(subjectData) {
            const container = document.getElementById('subject-trends-container');
            container.innerHTML = '';
            
            subjects.forEach((subject, index) => {
                const subjectInfo = subjectData[subject];
                
                // Skip subjects with no data
                if (subjectInfo.percentiles.length === 0) {
                    return;
                }
                
                // Create chart container
                const chartDiv = document.createElement('div');
                chartDiv.className = 'chart-container';
                
                const canvas = document.createElement('canvas');
                canvas.id = 'chart-' + subject.toLowerCase().replace(/\\s+/g, '-');
                chartDiv.appendChild(canvas);
                container.appendChild(chartDiv);
                
                // Format dates for display
                const formattedDates = subjectInfo.dates.map(date => {
                    const d = new Date(date);
                    return d.getDate() + '/' + (d.getMonth() + 1) + '/' + d.getFullYear();
                });
                
                // Create chart
                const ctx = canvas.getContext('2d');
                new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: formattedDates,
                        datasets: [{
                            label: subject + ' Percentile',
                            data: subjectInfo.percentiles,
                            borderColor: colors[index % colors.length],
                            backgroundColor: colors[index % colors.length] + '33',
                            borderWidth: 2,
                            pointRadius: 3,
                            fill: true,
                            tension: 0.1
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            title: {
                                display: true,
                                text: subject
                            },
                            tooltip: {
                                mode: 'index',
                                intersect: false
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                max: 100,
                                title: {
                                    display: true,
                                    text: 'Percentile'
                                }
                            },
                            x: {
                                title: {
                                    display: true,
                                    text: 'Test Date'
                                }
                            }
                        }
                    }
                });
            });
        }
        
        // Initialize dashboard
        async function initDashboard() {
            const data = await fetchData();
            
            if (data.length === 0) {
                    document.getElementById('loading').textContent = 'No data available. Please add test results first.';
                    return;
                }
                
                const subjectData = processDataBySubject(data);
                
                // Hide loading message and show dashboard content
                document.getElementById('loading').style.display = 'none';
                document.getElementById('dashboard-content').style.display = 'block';
                
                // Render all visualizations
                renderSubjectRankings(subjectData);
                renderOverallTrendChart(subjectData);
                renderSubjectTrendCharts(subjectData);
            }
            
            // Call the initialization function
            window.addEventListener('DOMContentLoaded', initDashboard);
        }
    </script>
</body>
</html>`;
