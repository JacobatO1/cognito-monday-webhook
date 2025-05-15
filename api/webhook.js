import fetch from "node-fetch"; // For local testing, ensure node-fetch is installed

const MONDAY_API_KEY = process.env.MONDAY_API_KEY;
const MONDAY_BOARD_ID = "64184574";

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const submission = req.body;

      // Safely extract fields from the Cognito form
      const bookingRef = submission.BookingReference || "";
      const agentName = submission.AgentsName || "";
      const propertyAddress = submission.PropertyAddress?.FullAddress || "";
      const jobDate = submission.JobDate || "";

      // This will be the item name in Monday.com
      const itemName = `${bookingRef} - ${propertyAddress}`;

      // Build the column values
      const columnValues = {
        Name: bookingRef,
        date: jobDate,
        text05: propertyAddress,
        status_1: submission.CompanyName || "",
        job_type: submission.JobType || "",
        no_bedrooms: submission.NoOfBedrooms || "",
        text0: submission.PropertyType || "",
        date5: submission.PropertyAvailableDate || "",
        date1: submission.StartOfTenancy || "",
        numbers23: submission.Id || "",
        long_text: submission.Comments || "",
        text: agentName,
        email: submission.AgentsEmail || "",
        text33: submission.LettingType || "",
        text1: submission.LeadTenantName?.FirstAndLast || "",
        email9: submission.LeadTenantEmail || "",
        phone: submission.LeadTenantPhone || "",
        numbers2: submission.Price?.replace("£", "") || "" // Ensure numeric value
      };

      // Serialize JSON and escape quotes properly
      const columnValuesStr = JSON.stringify(columnValues).replace(/\\/g, "\\\\").replace(/"/g, '\\"');

      const query = `
        mutation {
          create_item (
            board_id: ${MONDAY_BOARD_ID},
            group_id: "topics",
            item_name: "${itemName.replace(/"/g, '\\"')}",
            column_values: "${columnValuesStr}"
          ) {
            id
          }
        }
      `;

      const response = await fetch("https://api.monday.com/v2", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: MONDAY_API_KEY,
        },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();
      console.log("Monday.com response:", data);

      if (data.errors) {
        return res.status(500).json({ message: "Monday.com API error", errors: data.errors });
      }

      res.status(200).json({
        message: "Item created on Monday.com",
        itemId: data.data.create_item.id,
      });
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
  } else {
    res.status(405).json({ message: "Method Not Allowed" });
  }
}
