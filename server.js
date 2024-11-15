const express = require('express');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const app = express();

// Serve static files (CSS, JS, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// File path
const filePath = path.join(__dirname, 'Naujan Academy Inc_Bulk_Group-Registration_IT-Congress - Lenny Francisco.xlsx');

// Array to store already picked winners
let pickedWinners = [];

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/pick-winner', (req, res) => {
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

    const data = XLSX.utils.sheet_to_json(sheet, { header: "A", range: 1 });
    const namesAndDetails = data.map(row => ({
        'FIRST NAME': row['A'] || "",
        'LAST NAME': row['B'] || "",
        'MIDDLE INITIAL': row['C'] || "",
        'ADDRESS': row['D'] || "",
        'SCHOOL': row['E'] || ""
    }));

    if (req.query['get-names'] === 'true') {
        const names = namesAndDetails.map(item => ({
            firstName: item['FIRST NAME'],
            lastName: item['LAST NAME'],
            middleName: item['MIDDLE INITIAL'],
            address: item['ADDRESS'],
            school: item['SCHOOL']
        }));
        return res.json({ names });
    }

    const eligibleCandidates = namesAndDetails.filter(candidate => 
        !pickedWinners.some(winner =>
            winner['FIRST NAME'] === candidate['FIRST NAME'] &&
            winner['LAST NAME'] === candidate['LAST NAME'] &&
            winner['MIDDLE INITIAL'] === candidate['MIDDLE INITIAL']
        )
    );

    if (eligibleCandidates.length === 0) {
        return res.status(200).json({ message: "All participants have already won." });
    }

    const randomIndex = Math.floor(Math.random() * eligibleCandidates.length);
    const winner = eligibleCandidates[randomIndex];
    pickedWinners.push(winner);
    res.json({ winner });
});

app.post('/reset-winners', (req, res) => {
    pickedWinners = [];
    res.json({ success: true });
});

module.exports = app;
