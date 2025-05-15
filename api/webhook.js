export default async function handler(req, res) {
  if (req.method === "POST") {
    console.log("📬 Form submission received!");

    const submission = req.body;

    // Log it in the console (viewable in Vercel Logs)
    console.log("📝 Submission Data:", JSON.stringify(submission, null, 2));

    // Send a JSON response back (optional)
    res.status(200).json({
      message: "Form submission received!",
      data: submission
    });
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
