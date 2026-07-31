# Document Converter

A production-ready, lightweight web-based document conversion service built with Node.js, Express, and Multer, powered by the LibreOffice CLI engine. Designed with a minimalist, clean aesthetic and containerized for cloud deployment.

---

## Overview

Document Converter provides a streamlined interface for transforming files across multiple document formats. The architecture utilizes local system processes for high-fidelity rendering and conversion, wrapped in an Express backend and served through a minimalist single-page interface.

---

## Technical Specifications

- **Backend Runtime**: Node.js, Express.js
- **File Management**: Multer (temporary local storage with automated lifecycle cleanup)
- **Conversion Engine**: LibreOffice CLI (`soffice`), Poppler-utils (`pdftotext`)
- **Frontend**: HTML5, Vanilla JavaScript, CSS3 (Monochrome design system)

---

## Supported Formats

- **Documents**: `.docx`, `.doc`, `.odt`, `.txt`, `.rtf`, `.html`, `.pdf`
- **Spreadsheets**: `.xlsx`, `.xls`, `.ods`, `.csv`
- **Presentations**: `.pptx`, `.ppt`, `.odp`

---

## Directory Structure

```text
file-converter/
├── public/
│   ├── index.html        # Frontend user interface
│   └── favicon.svg       # Minimalist SVG favicon
├── uploads/              # Transient processing directory
├── .dockerignore         # Build exclusion configuration
├── .gitignore            # Version control exclusion rules
├── Dockerfile            # Container definition for Linux environments
├── package.json          # Project dependencies and scripts
└── server.js             # Core Express application server
```

---

## Local Development

### Prerequisites

- Node.js (Version 16 or higher)
- LibreOffice (Installed locally; ensure executable paths are accessible)

### Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd file-converter
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Initialize the development server:

   ```bash
   node server.js
   ```

4. Access the application in your browser:
   ```text
   http://localhost:3000
   ```

---

## Production Deployment (Render / Docker)

Because the conversion engine relies on system-level binary dependencies, deployment requires a containerized environment.

1. Push the repository to a remote version control provider (GitHub).
2. Create a new Web Service on Render.
3. Link the repository and select **Docker** as the environment runtime.
4. Deploy the service. Render will parse the `Dockerfile`, install LibreOffice and Poppler-utils, and initialize the application instance.

---

## License

This project is licensed under the MIT License. See the LICENSE file for details.
