import { launch } from 'puppeteer';

// canonical variant key → output PDF path
// Add new variants here as you create more resume-<key>.md files
const VARIANTS = {
    'front-end': 'public/resume-front-end.pdf',
};

const PDF_OPTIONS = {
    format: 'letter',
    printBackground: true,
    margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
};

async function generatePDFs() {
    const browser = await launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // Default resume
    await page.goto('http://localhost:4321/resume-print', { waitUntil: 'networkidle0' });
    await page.pdf({ path: './public/resume.pdf', ...PDF_OPTIONS });
    console.log('PDF saved: public/resume.pdf');

    // Variant resumes
    for (const [key, outPath] of Object.entries(VARIANTS)) {
        await page.goto(`http://localhost:4321/resume-print?aud=${key}`, { waitUntil: 'networkidle0' });
        await page.pdf({ path: `./${outPath}`, ...PDF_OPTIONS });
        console.log(`PDF saved: ${outPath}`);
    }

    await browser.close();
}

generatePDFs();
