const express = require('express');
const XLSX = require('xlsx');
const fs = require('fs');
const app = express();
const path = require('path');

// Serve static files (CSS, JS, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// File path
const filePath = 'Naujan Academy Inc_Bulk_Group-Registration_IT-Congress - Lenny Francisco.xlsx';

// Array to store already picked winners
let pickedWinners = [];

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/pick-winner', (req, res) => {
    // Check if the file exists
    if (!fs.existsSync(filePath)) {
        console.error("File does not exist at the specified path.");
        return res.status(404).send("File not found");
    }

    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    if (!sheet) {
        console.error("Selected sheet is empty or does not exist.");
        return res.status(500).send("Sheet not found");
    }

    // Convert sheet to JSON, with headers taken from row 1 and data starting from row 2
    const data = XLSX.utils.sheet_to_json(sheet, { header: "A", range: 1 });
    console.log("Raw Data:", JSON.stringify(data, null, 2));

    const namesAndDetails = data.map(row => ({
        'FIRST NAME': row['A'] || "",
        'LAST NAME': row['B'] || "",
        'MIDDLE INITIAL': row['C'] || "",
        'ADDRESS': row['D'] || "",
        'SCHOOL': row['E'] || ""
    }));

    console.log("Names and Details:", namesAndDetails);

    if (req.query['get-names'] === 'true') {
        const names = namesAndDetails.map(item => ({
            firstName: item['FIRST NAME'],
            lastName: item['LAST NAME'],
            middleName: item['MIDDLE INITIAL'],
            address: item['ADDRESS'],
            school: item['SCHOOL']
        }));
        console.log("Names to be sent:", names);
        return res.json({ names });
    }

    // Filter out already picked winners from the list of eligible candidates
    const eligibleCandidates = namesAndDetails.filter(candidate => 
        !pickedWinners.some(winner =>
            winner['FIRST NAME'] === candidate['FIRST NAME'] &&
            winner['LAST NAME'] === candidate['LAST NAME'] &&
            winner['MIDDLE INITIAL'] === candidate['MIDDLE INITIAL']
        )
    );

    // If no eligible candidates are left, return a message
    if (eligibleCandidates.length === 0) {
        console.log("All participants have already been picked as winners.");
        return res.status(200).json({ message: "All participants have already won." });
    }

    // Pick a random winner from the remaining eligible candidates
    const randomIndex = Math.floor(Math.random() * eligibleCandidates.length);
    const winner = eligibleCandidates[randomIndex];
    pickedWinners.push(winner); // Add the winner to the list of picked winners
    console.log("Winner:", winner);
    res.json({ winner });
});

app.post('/reset-winners', (req, res) => {
    try {
        pickedWinners = [];  // Now this works because `pickedWinners` is declared with `let`
        console.log("Winners have been reset.");
        res.json({ success: true });
    } catch (error) {
        console.error('Error resetting winners:', error);
        res.status(500).json({ error: 'Failed to reset winners' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
