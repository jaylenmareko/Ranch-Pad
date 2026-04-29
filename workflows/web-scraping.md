# Web Scraping

## Purpose
Scrape contact lists, emails, or data from a target website. Outputs a CSV for use in outreach or analysis.

## Inputs
- Target URL or site to scrape
- Python environment (`.venv` at repo root)
- A scraper script — either reuse an existing one or write a new one

## Steps

### 1. Pick or write a scraper
Existing scrapers (in `_scratch/` or repo root):

| Script | Target | Output |
|---|---|---|
| `ksffa_scraper.py` | KSFFA instructor directory | `ksffa_instructors.csv`, `ksffa_instructor_emails.csv` |
| `nefb_scraper.py` | NEFB regional managers | `nefb_regional_managers.csv` |
| `youtube_email_scraper.py` | YouTube channel about/contact pages | `m_email_scrape.csv` |

To write a new one, copy the closest existing scraper and adapt the selectors.

### 2. Activate the Python environment
```bash
source .venv/Scripts/activate   # Windows (bash)
# or
.venv\Scripts\activate          # Windows (cmd)
```

### 3. Install dependencies if needed
```bash
pip install requests beautifulsoup4 playwright pandas
```

### 4. Run the scraper
```bash
python ksffa_scraper.py
```
- Output CSV will be written to the current directory
- Move output to the project's outreach folder with a date stamp when done
  - e.g. `projects/business/Ranch-Pad/outreach/`

### 5. Clean the output
- Open the CSV in Excel or with pandas
- Remove duplicates, blank rows, junk values
- Confirm required columns are present before passing to outreach

## Outputs
- CSV file with scraped data (emails, names, orgs, etc.)

## Notes
- Some sites block scrapers — use `time.sleep()` between requests to avoid rate limits
- If a site uses JavaScript rendering, use Playwright instead of requests+BeautifulSoup
- `channel_ids_cache.json` stores YouTube channel IDs to avoid redundant lookups
- For beef/marbling images (MIA model training), see `meat-image-america/scripts/scrape_beef_images.py`
