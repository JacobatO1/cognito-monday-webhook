const MONDAY_API_KEY = process.env.MONDAY_FRANCHISE_API_KEY;
const MONDAY_BOARD_ID = 2046517792; // ✅ Your updated board ID
const MONDAY_GROUP_ID = "topics"; // ✅ Group where items will be created

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const submission = req.body;

    // ✅ Extract relevant fields from Cognito form
    const {
      BookingReference,
      JobDate,
      PropertyAddress,
      CompanyName,
      JobType,
      NoOfBedrooms,
      PropertyType,
      PropertyAvailableDate,
      StartOfTenancy,
      Id,
      Comments,
      AgentsName,
      AgentsEmail,
      LettingType,
      LeadTenantName,
      LeadTenantEmail,
      LeadTenantPhone,
      Price
    } = submission;

    const itemName = `${BookingReference}`;

    // ✅ Build column values
    const columnValues = {
      date: { date: JobDate }, // Job Date
      text05: PropertyAddress?.FullAddress || "", // Full Address
      status_1: { label: CompanyName }, // Company (Status column)
      job_type: { label: JobType }, // Job Type (Status column)
      no__bedrooms: NoOfBedrooms?.toString() || "", // No of Bedrooms (Number)
      text0: PropertyType, // Property Type (Text)
      date5: PropertyAvailableDate ? { date: PropertyAvailableDate } : null, // Property Available Date
      date1: StartOfTenancy ? { date: StartOfTenancy } : null, // Start of Tenancy
      numbers23: Id.toString(), // ✅ Send as text, not number
      long_text: { text: Comments || "" }, // Comments (Long Text)
      text: AgentsName, // Agent's Name (Text)
      email: { email: AgentsEmail, text: AgentsEmail }, // Agent's Email (Email)
      text33: LettingType, // Letting Type (Text)
      text1: LeadTenantName?.FirstAndLast || "", // Lead Tenant Name (Text)
      email9: { email: LeadTenantEmail, text: LeadTenantEmail }, // Lead Tenant Email (Email)
      phone: { phone: LeadTenantPhone, countryShortName: "GB" }, // Phone (Phone)
      numbers2: parseFloat(Price?.replace(/[^0-9.]/g, "")) || 0 // Price (Number, remove £)
    };

    // ✅ Remove nulls (optional: avoids error on missing optional fields)
    Object.keys(columnValues).forEach(
      key => columnValues[key] == null && delete columnValues[key]
    );

    // ✅ GraphQL mutation
    const query = `
      mutation {
        create_item(
          board_id: ${MONDAY_BOARD_ID},
          group_id: "${MONDAY_GROUP_ID}",
          item_name: "${itemName.replace(/"/g, '\\"')}",
          column_values: "${JSON.stringify(columnValues).replace(/"/g, '\\"')}"
        ) {
          id
        }
      }
    `;

    // ✅ Send request to Monday.com
    const response = await fetch("https://api.monday.com/v2", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: MONDAY_API_KEY
      },
      body: JSON.stringify({ query })
    });

    const data = await response.json();
    console.log("📬 Monday.com response:", JSON.stringify(data, null, 2));

    if (data.errors) {
      return res.status(500).json({ message: "Monday.com API error", errors: data.errors });
    }

    res.status(200).json({
      message: "✅ Item successfully created in Monday.com",
      itemId: data.data.create_item.id
    });
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
}
