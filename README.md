# Convert Station

A high-performance, privacy-focused document conversion web application built with Node.js and hosted on Vercel. It leverages the CloudConvert API with an optimized direct-upload architecture and immediate data purging to ensure user documents remain private and secure.

---

## Features

* **Privacy First (Immediate Deletion)**: Configured with automated clean-up tasks via CloudConvert API v2 to purge uploaded and converted files from remote servers instantly once processing concludes.
* **Direct-to-Cloud Uploads**: Bypasses Vercel's payload limits (4.5MB) by uploading large documents (up to 100MB) directly from the browser to CloudConvert storage.
* **Client-Side Drag & Drop**: Intuitive user interface supporting file drag-and-drop mechanics and automatic format mapping based on input extensions.
* **Zero Server Footprint**: Vercel serverless functions act exclusively as an orchestration bridge, meaning server instances never store or cache heavy document binaries.

---

## Supported Formats

| Input Format | Compatible Output Formats |
| :--- | :--- |
| `.docx` | PDF, `.doc`, `.txt`, `.odt` |
| `.doc` | PDF, `.docx`, `.txt` |
| `.pdf` | `.docx`, `.txt`, PNG, JPG |
| `.xlsx` | CSV, PDF, `.xls` |
| `.csv` | XLSX, PDF, `.txt` |
| `.pptx` | PDF, `.ppt` |
| `.txt` | PDF, `.docx` |

---

## Project Structure

```text
├── api/
│   ├── convert.js       # Initializes CloudConvert job and immediate delete tasks
│   └── status.js        # Polls ongoing job progress and fetches download links
├── public/
│   ├── index.html       # Frontend layout and user interface
│   ├── script.js        # Client-side logic, drag-and-drop, and API integration
│   └── style.css        # Styling and layout design
└── package.json         # Project dependencies and metadata

```
## Getting Started
**Prerequisites**
- Node.js installed locally.
- A free or paid CloudConvert API Key.

```

**Installation & Local Development**
```
1. Clone the repository:
```text
git clone [https://github.com/your-username/your-repo-name.git](https://github.com/your-username/your-repo-name.git)
cd your-repo-name
```
2. Install dependencies:
```text
npm install
```
3. Set up environment variables:\
Create a .env file in the root directory and add your CloudConvert API key:
```text
CLOUDCONVERT_API_KEY=your_api_key_here
```

