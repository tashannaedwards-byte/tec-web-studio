// ============================================================
// TEC Web Studio — Glow-Up Auto Email
// Google Apps Script — paste this into your Sheet's script editor
//
// HOW TO SET UP:
// 1. In your Google Sheet, click Extensions → Apps Script
// 2. Delete everything in the editor and paste this entire script
// 3. Click Save (floppy disk icon)
// 4. Click the dropdown next to "Run" and select "createTrigger"
// 5. Click Run — approve permissions when prompted
// 6. Done! Every new Jotform submission will trigger the email.
//
// TO TEST: Click the dropdown, select "testEmail", click Run,
//          then check your inbox at webstudiotec@gmail.com
// ============================================================

var SENDER_EMAIL    = "webstudiotec@gmail.com";
var SENDER_NAME     = "TEC Web Studio";
var EMAIL_SUBJECT   = "Your Website Glow-Up Recommendation is Ready";

// Column positions in your Google Sheet (1 = column A)
var COL_FIRST_NAME  = 1;   // Name - First Name
var COL_LAST_NAME   = 2;   // Name - Last Name
var COL_EMAIL       = 3;   // Email Address
var COL_COMPANY     = 4;   // Company or Organization Name
var COL_SERVICE     = 5;   // What kind of service do you need?
var COL_DESCRIPTION = 6;   // Briefly describe your website project...
var COL_TIMELINE    = 7;   // Preferred Timeline
var COL_CONTENT     = 8;   // Do you need content written
var COL_PAGES       = 9;   // Pages needed
var COL_FEATURES    = 10;  // Any special features or enhancements?
var COL_SUBMISSION  = 11;  // Submission ID

// ── CREATE TRIGGER ──────────────────────────────────────────
// Run this function ONCE to set up the automatic trigger.
// After that, it fires on its own every time a new row is added.
function createTrigger() {
  // Remove any existing triggers first to avoid duplicates
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === "onNewSubmission") {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  // Create a new onChange trigger on the active spreadsheet
  ScriptApp.newTrigger("onNewSubmission")
    .forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet())
    .onChange()
    .create();
  Logger.log("v Trigger created successfully.");
}

// ── MAIN HANDLER ────────────────────────────────────────────
// Fires automatically when the sheet changes (new Jotform row added).
function onNewSubmission(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var lastRow = sheet.getLastRow();

  // Skip header row — need at least row 2
  if (lastRow < 2) return;

  // Check if this row has already been processed
  // We use a hidden "Sent" marker in a column after Submission ID
  var sentCol = COL_SUBMISSION + 1;
  var sentCell = sheet.getRange(lastRow, sentCol);
  if (sentCell.getValue() === "SENT") return;

  // Get the latest row data
  var row = sheet.getRange(lastRow, 1, 1, COL_SUBMISSION).getValues()[0];

  var firstName   = row[COL_FIRST_NAME  - 1] || "";
  var lastName    = row[COL_LAST_NAME   - 1] || "";
  var email       = row[COL_EMAIL       - 1] || "";
  var fullName    = (firstName + " " + lastName).trim();

  // Validate — skip if no email
  if (!email || email.indexOf("@") === -1) {
    Logger.log("Skipped row " + lastRow + ": no valid email.");
    return;
  }

  // Send the email
  try {
    var htmlBody = buildEmailHtml(firstName || fullName);
    GmailApp.sendEmail(email, EMAIL_SUBJECT, "", {
      from:     SENDER_EMAIL,
      name:     SENDER_NAME,
      htmlBody: htmlBody,
      replyTo:  SENDER_EMAIL
    });

    // Mark row as sent
    sentCell.setValue("SENT");
    sentCell.setBackground("#d4edda");

    Logger.log("v Email sent to " + email + " (" + fullName + ")");
  } catch(err) {
    Logger.log("✗ Failed to send to " + email + ": " + err.toString());
  }
}

// ── BUILD EMAIL HTML ─────────────────────────────────────────
// Replaces {name} placeholder with the customer's first name.
function buildEmailHtml(firstName) {
  var html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>TEC Web Studio – Glow-Up Package</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f4f4;font-family:Georgia,serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f4f4;padding:30px 0;">
  <tr>
    <td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- HEADER -->
        <tr>
          <td style="background-color:#6AABB0;border-radius:16px 16px 0 0;padding:36px 40px 28px;text-align:center;">
            <div style="display:inline-block;background-color:#F5C842;border-radius:10px;padding:6px 14px;margin-bottom:14px;">
              <span style="font-family:Verdana,sans-serif;font-size:11px;font-weight:700;letter-spacing:2px;color:#111111;text-transform:uppercase;">TEC Web Studio</span>
            </div>
            <h1 style="margin:0;font-family:Georgia,serif;font-size:28px;font-weight:700;color:#ffffff;line-height:1.3;">Your Website Is About<br>to Get Its <span style="color:#F5C842;">Glow-Up</span> </h1>
            <p style="margin:14px 0 0;font-family:Verdana,sans-serif;font-size:13px;color:#ffffff;letter-spacing:0.5px;opacity:0.85;">Your personalized recommendation is ready</p>
          </td>
        </tr>

        <!-- GREETING -->
        <tr>
          <td style="background-color:#ffffff;padding:32px 40px 24px;">
            <p style="margin:0 0 16px;font-family:Verdana,sans-serif;font-size:14px;color:#333333;line-height:1.7;">Hi {name},</p>
            <p style="margin:0;font-family:Verdana,sans-serif;font-size:14px;color:#333333;line-height:1.7;">Thank you so much for filling out our form — we're excited to work with you! Based on your responses, we've found the perfect starting point for where you are right now:</p>
          </td>
        </tr>

        <!-- PACKAGE CARD -->
        <tr>
          <td style="background-color:#ffffff;padding:0 40px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#1a3d3d 0%,#2a5a5a 100%);border-radius:14px;overflow:hidden;">
              <tr>
                <td style="padding:6px 0 0;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="background-color:#F5C842;padding:10px 28px;">
                        <span style="font-family:Verdana,sans-serif;font-size:10px;font-weight:700;letter-spacing:2.5px;color:#111111;text-transform:uppercase;">* Recommended Package</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding:24px 28px 28px;">
                  <h2 style="margin:0 0 4px;font-family:Georgia,serif;font-size:26px;font-weight:700;color:#F5C842;">The Glow-Up</h2>
                  <p style="margin:0 0 16px;font-family:Verdana,sans-serif;font-size:12px;color:#6AABB0;letter-spacing:0.5px;">Best for small updates to your existing website</p>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:4px 0;">
                        <span style="font-family:Verdana,sans-serif;font-size:13px;color:#ffffff;">v&nbsp; Minor edits to text, images, and formatting</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:4px 0;">
                        <span style="font-family:Verdana,sans-serif;font-size:13px;color:#ffffff;">v&nbsp; 1–4 pages: <strong style="color:#F5C842;">$100</strong></span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:4px 0;">
                        <span style="font-family:Verdana,sans-serif;font-size:13px;color:#ffffff;">v&nbsp; 5–8 pages: <strong style="color:#F5C842;">$200</strong></span>
                      </td>
                    </tr>
                  </table>
                  <p style="margin:20px 0 0;font-family:Verdana,sans-serif;font-size:12px;color:#aaaaaa;line-height:1.6;font-style:italic;">This package is designed to give your site a polished, refreshed look without the hassle of a full redesign — clean, efficient, and effective.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- MAINTENANCE -->
        <tr>
          <td style="background-color:#ffffff;padding:0 40px 28px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border:2px solid #6AABB0;border-radius:12px;overflow:hidden;">
              <tr>
                <td style="background-color:#6AABB0;padding:10px 20px;">
                  <span style="font-family:Verdana,sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;color:#ffffff;text-transform:uppercase;">Optional After-Service Maintenance</span>
                </td>
              </tr>
              <tr>
                <td style="padding:20px;">
                  <p style="margin:0 0 14px;font-family:Verdana,sans-serif;font-size:13px;color:#333333;line-height:1.6;">Want to keep your site in great shape after we're done? We offer flexible maintenance options:</p>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr><td style="padding:3px 0;font-family:Verdana,sans-serif;font-size:13px;color:#333333;">• <strong style="color:#111111;">$25</strong> — 3-day turnaround</td></tr>
                    <tr><td style="padding:3px 0;font-family:Verdana,sans-serif;font-size:13px;color:#333333;">• <strong style="color:#111111;">$35</strong> — 2-day turnaround</td></tr>
                    <tr><td style="padding:3px 0;font-family:Verdana,sans-serif;font-size:13px;color:#333333;">• <strong style="color:#111111;">$50</strong> — 24-hour turnaround</td></tr>
                    <tr><td style="padding:3px 0;font-family:Verdana,sans-serif;font-size:13px;color:#333333;">• <strong style="color:#111111;">$50/month</strong> — Monthly Maintenance (upon request)</td></tr>
                  </table>
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f7f9f9;border-radius:8px;margin-top:12px;">
                    <tr>
                      <td style="padding:14px 16px;">
                        <p style="margin:0 0 6px;font-family:Verdana,sans-serif;font-size:12px;font-weight:700;color:#111111;">$150/month — Active Site Maintenance</p>
                        <p style="margin:0 0 4px;font-family:Verdana,sans-serif;font-size:11px;color:#555555;font-style:italic;">For E-commerce &amp; High-Frequency Sites</p>
                        <p style="margin:6px 0 0;font-family:Verdana,sans-serif;font-size:12px;color:#555555;">-> Unlimited updates · Seasonal promotions &amp; banners · Priority turnaround · New page builds</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- HOSTING SECTION -->
        <tr>
          <td style="background-color:#ffffff;padding:0 40px 28px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border:2px solid #e8b800;border-radius:12px;overflow:hidden;">
              <tr>
                <td style="background-color:#F5C842;padding:10px 20px;">
                  <span style="font-family:Verdana,sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;color:#111111;text-transform:uppercase;"> One More Thing — Where Will Your Site Live?</span>
                </td>
              </tr>
              <tr>
                <td style="padding:20px 24px 16px;">
                  <p style="margin:0 0 6px;font-family:Verdana,sans-serif;font-size:14px;font-weight:700;color:#111111;line-height:1.5;">Your website has two parts:</p>
                  <p style="margin:0 0 16px;font-family:Verdana,sans-serif;font-size:13px;color:#333333;line-height:1.7;"><strong style="color:#111111;">The design</strong> — that's what we build for you.<br><strong style="color:#111111;">The hosting</strong> — that's where your site actually lives on the internet, so people can find it.</p>
                  <p style="margin:0 0 20px;font-family:Verdana,sans-serif;font-size:13px;color:#333333;line-height:1.7;">Hosting is a separate, ongoing cost you'll pay directly to the platform of your choice. The good news: it's usually affordable, and <strong style="color:#111111;">you own your account completely</strong> — we're only added as your developer to build the site.</p>

                  <!-- Platform cards -->
                  <table width="100%" cellpadding="0" cellspacing="0">

                    <!-- Wix -->
                    <tr>
                      <td style="padding:0 0 10px;">
                        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f7f9f9;border:1px solid #dde8ea;border-radius:10px;">
                          <tr>
                            <td style="padding:14px 16px;">
                              <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                  <td>
                                    <p style="margin:0 0 2px;font-family:Verdana,sans-serif;font-size:13px;font-weight:700;color:#111111;">Wix</p>
                                    <p style="margin:0 0 6px;font-family:Verdana,sans-serif;font-size:11px;color:#6AABB0;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;">Best for: Small businesses, portfolios, simple service sites</p>
                                    <p style="margin:0;font-family:Verdana,sans-serif;font-size:12px;color:#555555;line-height:1.5;">Drag-and-drop friendly, easy to manage on your own after launch. Great if you want to make small edits yourself without tech knowledge.</p>
                                  </td>
                                  <td style="width:90px;text-align:right;vertical-align:top;">
                                    <span style="font-family:Verdana,sans-serif;font-size:12px;font-weight:700;color:#3d7a80;">~$17/mo</span>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <!-- Squarespace -->
                    <tr>
                      <td style="padding:0 0 10px;">
                        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f7f9f9;border:1px solid #dde8ea;border-radius:10px;">
                          <tr>
                            <td style="padding:14px 16px;">
                              <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                  <td>
                                    <p style="margin:0 0 2px;font-family:Verdana,sans-serif;font-size:13px;font-weight:700;color:#111111;">Squarespace</p>
                                    <p style="margin:0 0 6px;font-family:Verdana,sans-serif;font-size:11px;color:#6AABB0;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;">Best for: Creatives, photographers, salons, professional services</p>
                                    <p style="margin:0;font-family:Verdana,sans-serif;font-size:12px;color:#555555;line-height:1.5;">Known for beautiful, polished designs. A great fit if presentation and aesthetics are a top priority for your business.</p>
                                  </td>
                                  <td style="width:90px;text-align:right;vertical-align:top;">
                                    <span style="font-family:Verdana,sans-serif;font-size:12px;font-weight:700;color:#3d7a80;">~$16/mo</span>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <!-- WordPress -->
                    <tr>
                      <td style="padding:0 0 10px;">
                        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f7f9f9;border:1px solid #dde8ea;border-radius:10px;">
                          <tr>
                            <td style="padding:14px 16px;">
                              <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                  <td>
                                    <p style="margin:0 0 2px;font-family:Verdana,sans-serif;font-size:13px;font-weight:700;color:#111111;">WordPress</p>
                                    <p style="margin:0 0 6px;font-family:Verdana,sans-serif;font-size:11px;color:#6AABB0;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;">Best for: Blogs, growing businesses, content-heavy sites</p>
                                    <p style="margin:0;font-family:Verdana,sans-serif;font-size:12px;color:#555555;line-height:1.5;">The most powerful and flexible option. Ideal if you plan to grow your site over time or need a blog. Requires a separate web host (like Bluehost or SiteGround, ~$3–$10/mo).</p>
                                  </td>
                                  <td style="width:90px;text-align:right;vertical-align:top;">
                                    <span style="font-family:Verdana,sans-serif;font-size:12px;font-weight:700;color:#3d7a80;">~$5–$15/mo</span>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <!-- Shopify -->
                    <tr>
                      <td style="padding:0 0 10px;">
                        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f7f9f9;border:1px solid #dde8ea;border-radius:10px;">
                          <tr>
                            <td style="padding:14px 16px;">
                              <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                  <td>
                                    <p style="margin:0 0 2px;font-family:Verdana,sans-serif;font-size:13px;font-weight:700;color:#111111;">Shopify</p>
                                    <p style="margin:0 0 6px;font-family:Verdana,sans-serif;font-size:11px;color:#6AABB0;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;">Best for: Online stores, product-based businesses, e-commerce</p>
                                    <p style="margin:0;font-family:Verdana,sans-serif;font-size:12px;color:#555555;line-height:1.5;">The go-to platform if you sell products online. Handles payments, inventory, and shipping all in one place.</p>
                                  </td>
                                  <td style="width:90px;text-align:right;vertical-align:top;">
                                    <span style="font-family:Verdana,sans-serif;font-size:12px;font-weight:700;color:#3d7a80;">~$29/mo</span>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <!-- Webflow -->
                    <tr>
                      <td style="padding:0 0 10px;">
                        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f7f9f9;border:1px solid #dde8ea;border-radius:10px;">
                          <tr>
                            <td style="padding:14px 16px;">
                              <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                  <td>
                                    <p style="margin:0 0 2px;font-family:Verdana,sans-serif;font-size:13px;font-weight:700;color:#111111;">Webflow</p>
                                    <p style="margin:0 0 6px;font-family:Verdana,sans-serif;font-size:11px;color:#6AABB0;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;">Best for: Design-forward businesses, agencies, custom layouts</p>
                                    <p style="margin:0;font-family:Verdana,sans-serif;font-size:12px;color:#555555;line-height:1.5;">A powerful visual builder for highly custom, polished sites. More design flexibility than most platforms — great if you want something truly unique.</p>
                                  </td>
                                  <td style="width:90px;text-align:right;vertical-align:top;">
                                    <span style="font-family:Verdana,sans-serif;font-size:12px;font-weight:700;color:#3d7a80;">~$14/mo</span>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <!-- GitHub Pages (Free) -->
                    <tr>
                      <td style="padding:0 0 0;">
                        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f9f9;border:1px solid #6AABB0;border-radius:10px;">
                          <tr>
                            <td style="padding:14px 16px;">
                              <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                  <td>
                                    <p style="margin:0 0 2px;font-family:Verdana,sans-serif;font-size:13px;font-weight:700;color:#111111;">GitHub Pages <span style="background-color:#6AABB0;color:#ffffff;font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;letter-spacing:0.5px;margin-left:4px;">FREE</span></p>
                                    <p style="margin:0 0 6px;font-family:Verdana,sans-serif;font-size:11px;color:#6AABB0;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;">Best for: Simple, static sites with no complex features</p>
                                    <p style="margin:0;font-family:Verdana,sans-serif;font-size:12px;color:#555555;line-height:1.5;">100% free hosting — but keep in mind: your site will be written in plain code (HTML/CSS). You won't be able to make changes yourself without some technical knowledge. Great if you're comfortable letting me handle all future updates.</p>
                                  </td>
                                  <td style="width:90px;text-align:right;vertical-align:top;">
                                    <span style="font-family:Verdana,sans-serif;font-size:12px;font-weight:700;color:#3d7a80;">Free</span>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                  </table>

                  <p style="margin:14px 0 0;font-family:Verdana,sans-serif;font-size:13px;color:#333333;line-height:1.7;background-color:#f0f9f9;border-left:3px solid #6AABB0;padding:12px 14px;border-radius:0 8px 8px 0;"><strong style="color:#111111;">Not sure how to set up your account or add us as a developer?</strong><br>No worries — we'll walk you through it for free. Just let me know when you reply!</p>
                  <p style="margin:16px 0 0;font-family:Verdana,sans-serif;font-size:11px;color:#888888;line-height:1.6;">* You will own your hosting account, so everything stays in your control. we will only be added as your developer to build your site.</p>
                  <p style="margin:10px 0 0;font-family:Verdana,sans-serif;font-size:13px;color:#333333;line-height:1.7;"><strong style="color:#111111;">Not sure which to pick?</strong> No worries — just let me know when you reply and we'll help you choose the best fit for your business.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- EXPEDITED -->
        <tr>
          <td style="background-color:#ffffff;padding:0 40px 28px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fffbea;border-left:4px solid #F5C842;border-radius:0 10px 10px 0;padding:0;">
              <tr>
                <td style="padding:16px 20px;">
                  <p style="margin:0 0 6px;font-family:Verdana,sans-serif;font-size:12px;font-weight:700;color:#111111;letter-spacing:0.5px;"> Need It Faster?</p>
                  <p style="margin:0;font-family:Verdana,sans-serif;font-size:13px;color:#444444;line-height:1.6;">In a time crunch? Add expedited delivery for just <strong style="color:#111111;">$75</strong> and we'll prioritize your project to get it done sooner.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td style="background-color:#ffffff;padding:0 40px 40px;text-align:center;">
            <p style="margin:0 0 20px;font-family:Verdana,sans-serif;font-size:14px;color:#333333;line-height:1.7;">We'd love to bring your vision to life! When you're ready, simply click below to move forward:</p>
            <a href="https://www.tecwebsolution.com/payments.html?package=glowup" style="display:inline-block;background-color:#F5C842;color:#111111;font-family:Verdana,sans-serif;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;text-decoration:none;padding:16px 40px;border-radius:50px;"> Get Started Now</a>
            <p style="margin:20px 0 0;font-family:Verdana,sans-serif;font-size:13px;color:#777777;line-height:1.6;">Have questions before getting started? Don't hesitate to reach out — we're happy to help!</p>
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="background-color:#6AABB0;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;">
            <p style="margin:0 0 4px;font-family:Verdana,sans-serif;font-size:13px;color:#F5C842;font-weight:700;">The TEC Web Studio Team</p>
            info@tecwebstudio.com
  html = html.replace(/\{name\}/g, firstName || "there");
  return html;
}

// ── TEST FUNCTION ────────────────────────────────────────────
// Run this manually to send a test email to yourself.
function testEmail() {
  var htmlBody = buildEmailHtml("Test Customer");
  GmailApp.sendEmail(SENDER_EMAIL, "TEST — " + EMAIL_SUBJECT, "", {
    from:     SENDER_EMAIL,
    name:     SENDER_NAME,
    htmlBody: htmlBody,
    replyTo:  SENDER_EMAIL
  });
  Logger.log("v Test email sent to " + SENDER_EMAIL);
}
