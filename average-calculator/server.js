const express = require('express');
const axios = require('axios');
const app = express();
const port = 9876;

// Configuration
const windowSize = 10;
const timeout = 1000; // milliseconds
const maxRetries = 3;
let numberWindow = [];

// Helper function to fetch numbers with retries
const fetchNumbers = async (qualifier, retries = maxRetries) => {
    const url = `https://example.com/numbers/${qualifier}`; // Replace with actual third-party URL

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const startTime = Date.now();
            const response = await axios.get(url, { timeout });
            const endTime = Date.now();
            console.log(`Fetched numbers on attempt ${attempt}: ${response.data.numbers} in ${endTime - startTime}ms`);
            return response.data.numbers; // Assuming the API response has a `numbers` array
        } catch (error) {
            if (error.code === 'ECONNABORTED') {
                console.error(`Attempt ${attempt}: Request timed out`);
            } else {
                console.error(`Attempt ${attempt}: Error fetching numbers: ${error.message}`);
            }
        }
    }
    console.error('Failed to fetch numbers after maximum retries');
    return [];
};

// Helper function to calculate the average
const calculateAverage = (numbers) => {
    if (numbers.length === 0) return 0;
    const sum = numbers.reduce((acc, num) => acc + num, 0);
    return sum / numbers.length;
};

app.get('/numbers/:numberid', async (req, res) => {
    const { numberid } = req.params;

    // Validate the qualifier
    if (!['p', 'f', 'e', 'r'].includes(numberid)) {
        return res.status(400).send('Invalid qualifier');
    }

    // Fetch new numbers
    const newNumbers = await fetchNumbers(numberid);

    if (newNumbers.length === 0) {
        console.warn('No new numbers fetched');
    }

    // Store previous state of the window
    const prevState = [...numberWindow];

    // Update the window with unique numbers, avoiding duplicates
    newNumbers.forEach((num) => {
        if (!numberWindow.includes(num)) {
            if (numberWindow.length >= windowSize) {
                numberWindow.shift(); // Remove the oldest number
            }
            numberWindow.push(num); // Add the new number
        }
    });

    // Calculate the average
    const avg = calculateAverage(numberWindow);

    // Respond with the data
    res.json({
        numbers: newNumbers,
        windowPrevState: prevState,
        windowCurrState: numberWindow,
        avg: avg.toFixed(2),
    });
});

app.listen(port, () => {
    console.log(`Average Calculator microservice running on http://localhost:${port}`);
});
