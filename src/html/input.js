export const input_html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NEET PG Tracker - Input Form</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        h1 {
            text-align: center;
        }
        .form-group {
            margin-bottom: 15px;
        }
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
        }
        input[type="date"],
        input[type="number"] {
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        button {
            background-color: #4CAF50;
            color: white;
            padding: 10px 15px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
        }
        button:hover {
            background-color: #45a049;
        }
        .subject-container {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: 20px;
        }
        .subject-card {
            border: 1px solid #ddd;
            padding: 15px;
            border-radius: 5px;
        }
        .subject-title {
            font-weight: bold;
            margin-bottom: 10px;
            font-size: 18px;
        }
        .subject-fields {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
        }
        .error {
            color: red;
            font-size: 14px;
        }
        .success {
            color: green;
            font-size: 14px;
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
    </style>
</head>
<body>
    <div class="nav">
        <a href="/">Input Form</a>
        <a href="/dashboard">Dashboard</a>
    </div>
    
    <h1>NEET PG Grand Test Tracker</h1>
    
    <div class="form-group">
        <label for="test_date">Test Date:</label>
        <input type="date" id="test_date" name="test_date" required>
    </div>
    
    <div class="subject-container" id="subjects-container">
        <!-- Subject cards will be generated here -->
    </div>
    
    <div class="form-group" style="margin-top: 20px; text-align: center;">
        <button type="button" id="submit-btn">Submit Grand Test Results</button>
        <p id="status-message"></p>
    </div>
    
    <script>
        const subjects = [
            "Anatomy", 
            "Physiology", 
            "Biochemistry", 
            "Pathology", 
            "Microbiology", 
            "Pharmacology", 
            "Forensic Medicine", 
            "Community Medicine", 
            "ENT", 
            "Ophthalmology", 
            "Medicine", 
            "Surgery", 
            "Obstetrics & Gynecology", 
            "Pediatrics", 
            "Dermatology", 
            "Psychiatry", 
            "Orthopedics", 
            "Anesthesia", 
            "Radiology"
        ];
        
        // Generate subject cards
        const subjectsContainer = document.getElementById('subjects-container');
        
        subjects.forEach(subject => {
            const subjectCard = document.createElement('div');
            subjectCard.className = 'subject-card';
            
            const subjectTitle = document.createElement('div');
            subjectTitle.className = 'subject-title';
            subjectTitle.textContent = subject;
            
            const subjectFields = document.createElement('div');
            subjectFields.className = 'subject-fields';
            
            const fields = [
                { name: 'total_questions', label: 'Total Questions', value: '0' },
                { name: 'correct', label: 'Correct', value: '0' },
                { name: 'incorrect', label: 'Incorrect', value: '0' },
                { name: 'skipped', label: 'Skipped', value: '0' },
                { name: 'percentile', label: 'Percentile', value: '0', step: '0.01' }
            ];
            
            fields.forEach(field => {
                const fieldContainer = document.createElement('div');
                
                const label = document.createElement('label');
                label.textContent = field.label;
                label.setAttribute('for', \`\${subject}_\${field.name}\`);
                
                const input = document.createElement('input');
                input.type = 'number';
                input.id = \`${subject}_${field.name}\`;
                input.name = \`${subject}_${field.name}\`;
                input.value = field.value;
                input.min = '0';
                if (field.step) {
                    input.step = field.step;
                }
                
                fieldContainer.appendChild(label);
                fieldContainer.appendChild(input);
                subjectFields.appendChild(fieldContainer);
            });
            
            subjectCard.appendChild(subjectTitle);
            subjectCard.appendChild(subjectFields);
            subjectsContainer.appendChild(subjectCard);
        });
        
        // Submit form data
        document.getElementById('submit-btn').addEventListener('click', async () => {
            const testDate = document.getElementById('test_date').value;
            
            if (!testDate) {
                document.getElementById('status-message').textContent = 'Please select a test date';
                document.getElementById('status-message').className = 'error';
                return;
            }
            
            const formData = {
                test_date: testDate
            };
            
            subjects.forEach(subject => {
                const totalQuestions = parseInt(document.getElementById(\`${subject}_total_questions\`).value) || 0;
                const correct = parseInt(document.getElementById(\`${subject}_correct\`).value) || 0;
                const incorrect = parseInt(document.getElementById(\`${subject}_incorrect\`).value) || 0;
                const skipped = parseInt(document.getElementById(\`${subject}_skipped\`).value) || 0;
                const percentile = parseFloat(document.getElementById(\`${subject}_percentile\`).value) || 0;
                
                // Only include subjects with data
                if (totalQuestions > 0 || correct > 0 || incorrect > 0 || skipped > 0 || percentile > 0) {
                    formData[subject] = {
                        total_questions: totalQuestions,
                        correct: correct,
                        incorrect: incorrect,
                        skipped: skipped,
                        percentile: percentile
                    };
                }
            });
            
            try {
                const response = await fetch('/api/submit', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });
                
                const result = await response.json();
                
                if (response.ok) {
                    document.getElementById('status-message').textContent = 'Data saved successfully!';
                    document.getElementById('status-message').className = 'success';
                } else {
                    document.getElementById('status-message').textContent = `Error: ${result.error || 'Unknown error'}`;
                    document.getElementById('status-message').className = 'error';
                }
            } catch (error) {
                document.getElementById('status-message').textContent = `Error: ${error.message}`;
                document.getElementById('status-message').className = 'error';
            }
        });
    </script>
</body>
</html>`;
