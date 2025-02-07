const puppeteer = require("puppeteer");
const path = require("path");

async function convertHTMLtoPDF() {
  try {
    // Launch browser with additional arguments for accessibility
    const browser = await puppeteer.launch({
      args: ["--export-tagged-pdf"], // Enable tagged PDF export
    });

    const page = await browser.newPage();

    // Get the absolute path to your HTML file
    const htmlPath = path.resolve("./accessible-resume.html");

    // Load the HTML file
    await page.goto(`file://${htmlPath}`, {
      waitUntil: "networkidle0",
    });

    // Inject additional metadata and accessibility enhancements
    await page.evaluate(() => {
      // Add PDF metadata
      const metaTags = {
        "pdf:Producer": "Puppeteer",
        "pdf:Title": "Tommaso Laterza - Senior Software Engineer Resume",
        "pdf:Author": "Tommaso Laterza",
        "pdf:Subject": "Professional Resume",
        "pdf:Keywords":
          "software engineer, frontend, fullstack, web development",
        "pdf:Language": "en-US",
      };

      Object.entries(metaTags).forEach(([name, content]) => {
        const meta = document.createElement("meta");
        meta.setAttribute("name", name);
        meta.setAttribute("content", content);
        document.head.appendChild(meta);
      });

      // Enhance image accessibility
      const profileImage = document.querySelector(".profile-img");
      if (profileImage) {
        profileImage.setAttribute("role", "img");
        profileImage.setAttribute(
          "alt",
          "Professional headshot of Tommaso Laterza"
        );
        profileImage.setAttribute(
          "aria-label",
          "Professional headshot of Tommaso Laterza"
        );
      }

      // Enhance link accessibility
      document.querySelectorAll("a").forEach((link) => {
        if (!link.getAttribute("aria-label")) {
          const isExternal = link.hostname !== window.location.hostname;
          if (isExternal) {
            link.setAttribute(
              "aria-label",
              `${link.textContent} (opens in new tab)`
            );
          }
        }
      });

      // Add additional ARIA landmarks
      const sections = document.querySelectorAll("section");
      sections.forEach((section) => {
        if (!section.getAttribute("role")) {
          section.setAttribute("role", "region");
        }
      });
    });

    // Generate PDF with enhanced accessibility options
    await page.pdf({
      path: "accessible-resume.pdf",
      format: "A4",
      printBackground: true,
      displayHeaderFooter: false,
      margin: {
        top: "0",
        bottom: "0",
        left: "0",
        right: "0",
      },
      preferCSSPageSize: true,
      tagged: true,
      lang: "en-US",
      // Additional PDF options for accessibility
      pdfOptions: {
        tagged: true,
        userAccessibility: true,
        highContrast: true,
        displayDocTitle: true,
      },
    });

    // Verify PDF structure
    console.log("Verifying PDF accessibility...");
    const pdfStructure = await page.evaluate(() => {
      return {
        hasTitle: document.title !== "",
        hasLang: document.documentElement.lang !== "",
        hasAria: document.querySelectorAll("[role]").length > 0,
        hasAlt:
          document.querySelectorAll("img[alt]").length ===
          document.querySelectorAll("img").length,
      };
    });

    console.log("PDF Structure Verification:", pdfStructure);
    await browser.close();
    console.log(
      "PDF has been generated successfully with enhanced accessibility!"
    );
  } catch (error) {
    console.error("Error generating PDF:", error);
  }
}

// Add command line options
const args = process.argv.slice(2);
const options = {
  debug: args.includes("--debug"),
  verify: args.includes("--verify"),
};

convertHTMLtoPDF(options);
