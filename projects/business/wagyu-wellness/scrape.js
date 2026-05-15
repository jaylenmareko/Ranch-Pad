const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto('https://kongrolls.com', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(4000);

  const data = await page.evaluate(() => {
    // fonts
    const fonts = [...new Set(
      Array.from(document.querySelectorAll('*')).map(el => getComputedStyle(el).fontFamily).filter(Boolean)
    )].slice(0, 20);

    // colors used most
    const colors = [...new Set(
      Array.from(document.querySelectorAll('*')).flatMap(el => {
        const s = getComputedStyle(el);
        return [s.color, s.backgroundColor, s.borderColor];
      }).filter(c => c && c !== 'rgba(0, 0, 0, 0)' && c !== 'rgb(0, 0, 0)' && c !== 'rgb(255, 255, 255)')
    )].slice(0, 30);

    // headings
    const headings = Array.from(document.querySelectorAll('h1,h2,h3')).map(h => ({
      tag: h.tagName,
      text: h.innerText.trim().slice(0, 120),
      fontSize: getComputedStyle(h).fontSize,
      fontFamily: getComputedStyle(h).fontFamily,
      fontWeight: getComputedStyle(h).fontWeight,
      letterSpacing: getComputedStyle(h).letterSpacing,
      textTransform: getComputedStyle(h).textTransform,
      color: getComputedStyle(h).color,
    })).filter(h => h.text);

    // buttons
    const buttons = Array.from(document.querySelectorAll('a,button')).slice(0, 20).map(el => ({
      text: el.innerText.trim().slice(0, 60),
      bg: getComputedStyle(el).backgroundColor,
      color: getComputedStyle(el).color,
      border: getComputedStyle(el).border,
      borderRadius: getComputedStyle(el).borderRadius,
      padding: getComputedStyle(el).padding,
      fontSize: getComputedStyle(el).fontSize,
      letterSpacing: getComputedStyle(el).letterSpacing,
      textTransform: getComputedStyle(el).textTransform,
    })).filter(b => b.text);

    // body bg and text color
    const bodyStyle = getComputedStyle(document.body);

    // images
    const images = Array.from(document.querySelectorAll('img')).map(img => ({
      src: img.src, alt: img.alt, w: img.naturalWidth, h: img.naturalHeight
    })).filter(i => i.src && !i.src.includes('data:') && i.w > 100).slice(0, 10);

    // page text
    const text = document.body.innerText.slice(0, 3000);

    return { fonts, colors, headings, buttons, bodyStyle: { bg: bodyStyle.backgroundColor, color: bodyStyle.color, fontFamily: bodyStyle.fontFamily }, images, text };
  });

  console.log('=== BODY ===');
  console.log(JSON.stringify(data.bodyStyle, null, 2));
  console.log('\n=== FONTS ===');
  data.fonts.forEach(f => console.log(f));
  console.log('\n=== COLORS ===');
  data.colors.forEach(c => console.log(c));
  console.log('\n=== HEADINGS ===');
  data.headings.forEach(h => console.log(JSON.stringify(h)));
  console.log('\n=== BUTTONS ===');
  data.buttons.forEach(b => console.log(JSON.stringify(b)));
  console.log('\n=== IMAGES ===');
  data.images.forEach(i => console.log(`${i.w}x${i.h} | ${i.alt} | ${i.src}`));
  console.log('\n=== TEXT ===');
  console.log(data.text);

  await browser.close();
})();
