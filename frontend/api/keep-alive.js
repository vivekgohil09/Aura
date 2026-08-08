export default async function handler(req, res) {
  try {
    const response = await fetch('https://aura-vdcq.onrender.com/api/health');
    const data = await response.text();
    return res.status(200).json({ success: true, backendResponse: data });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
