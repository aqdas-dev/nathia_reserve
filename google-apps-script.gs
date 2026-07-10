/**
 * The Nathia Reserve — "Let's Talk" form → Google Sheet + email notification.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * SETUP (do this while logged in as aqdas.ewebcraft@gmail.com)
 * ─────────────────────────────────────────────────────────────────────────
 * 1. Create a new Google Sheet (sheets.new). Name it e.g. "Nathia Enquiries".
 * 2. In the sheet: Extensions ▸ Apps Script.
 * 3. Delete any sample code, paste EVERYTHING in this file, and Save.
 * 4. Click "Deploy" ▸ "New deployment".
 *      - Select type (gear icon) ▸ "Web app".
 *      - Description: anything (e.g. "Nathia form").
 *      - Execute as:      Me (aqdas.ewebcraft@gmail.com)
 *      - Who has access:  Anyone
 *      - Click "Deploy", then "Authorize access" and allow the permissions.
 * 5. Copy the "Web app" URL (looks like
 *      https://script.google.com/macros/s/AKfycb..../exec ).
 * 6. Open  src/main.js  and replace  PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE
 *    with that URL. Save. Done — submissions now land in the sheet.
 *
 * NOTE: If you change this script later, you must "Deploy ▸ Manage deployments
 *       ▸ Edit ▸ New version" for the changes to go live (the /exec URL stays
 *       the same).
 * ─────────────────────────────────────────────────────────────────────────
 */

// Where to send a notification email for each submission (leave "" to disable).
var NOTIFY_EMAIL = "aqdas.ewebcraft@gmail.com";

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Submissions") || ss.insertSheet("Submissions");

    // Ensure the header row exists AND matches the current form fields. This
    // self-heals an older deployment (e.g. a "Name / Subject" layout): if row 1
    // isn't the current header, the correct header is inserted at the top.
    var HEADER = ["Timestamp", "First Name", "Last Name", "Phone", "Email", "City", "Category", "Message"];
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADER);
    } else if (sheet.getRange(1, 2).getValue() !== "First Name") {
      sheet.insertRowBefore(1);
      sheet.getRange(1, 1, 1, HEADER.length).setValues([HEADER]);
    }

    var p = (e && e.parameter) || {};
    sheet.appendRow([
      new Date(),
      p.FirstName || "",
      p.LastName  || "",
      p.Phone     || "",
      p.Email     || "",
      p.City      || "",
      p.Category  || "",
      p.Message   || ""
    ]);

    if (NOTIFY_EMAIL) {
      MailApp.sendEmail({
        to: NOTIFY_EMAIL,
        replyTo: p.Email || NOTIFY_EMAIL,
        subject: "New waitlist signup — " + ((p.FirstName || "") + " " + (p.LastName || "")).trim(),
        body:
          "First Name: " + (p.FirstName || "") + "\n" +
          "Last Name: "  + (p.LastName  || "") + "\n" +
          "Phone: "      + (p.Phone     || "") + "\n" +
          "Email: "      + (p.Email     || "") + "\n" +
          "City: "       + (p.City      || "") + "\n" +
          "Category: "   + (p.Category  || "") + "\n\n" +
          "Message:\n"   + (p.Message   || "")
      });
    }

    return ContentService
      .createTextOutput(JSON.stringify({ result: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: "error", message: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Lets you open the /exec URL in a browser to confirm it's live.
function doGet() {
  return ContentService.createTextOutput("Nathia form endpoint is running.");
}
