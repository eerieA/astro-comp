import { launch } from 'puppeteer';

async function printResumeToPDF() {
    // Launch the browser
    const browser = await launch({ headless: true }); // Set headless to true to hide the browser window
    const page = await browser.newPage();

    // Navigate to the resume page
    await page.goto('http://localhost:4321/resume-print', { waitUntil: 'networkidle0' });

    // Optionally, adjust viewport to match preferred dimensions for printing
    await page.setViewport({ width: 1280, height: 800 });

    await page.pdf({
        path: './public/resume.pdf', // Output path
        format: 'letter',
        printBackground: true, // To include background colors
        margin: {
            top: '10mm',
            right: '10mm',
            bottom: '10mm',
            left: '10mm',
        },
    });

    console.log('PDF saved as resume.pdf');

    // Close the browser
    await browser.close();
}

printResumeToPDF();
