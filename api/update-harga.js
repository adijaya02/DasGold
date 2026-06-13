export default function handler(req, res) {
  res.json({
    hasKey: !!process.env.SUPABASE_KEY
  });
}
