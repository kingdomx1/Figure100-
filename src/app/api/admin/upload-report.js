// pages/api/admin/upload-report.js
import formidable from "formidable";
import fs from "fs";
import path from "path";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end("Method Not Allowed");

  const form = new formidable.IncomingForm();
  form.parse(req, (err, fields, files) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ ok: false, error: "parse_error" });
    }
    // files.report เป็นไฟล์ PDF
    const file = files.report;
    if (!file) return res.status(400).json({ ok: false, error: "no_file" });

    // ตัวอย่าง: ย้ายไฟล์ไปไว้ที่ /tmp หรือ directory ใด ๆ ที่เซิร์ฟเวอร์สามารถเขียนได้
    const data = fs.readFileSync(file.path);
    const destPath = path.join(process.cwd(), "public", "reports");
    if (!fs.existsSync(destPath)) fs.mkdirSync(destPath, { recursive: true });
    const filename = `${Date.now()}_${file.name}`;
    fs.writeFileSync(path.join(destPath, filename), data);

    return res.status(200).json({ ok: true, url: `/reports/${filename}` });
  });
}
