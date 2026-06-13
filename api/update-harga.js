export default async function handler(req, res) {
    return res.json({
        supabaseKeyExists: !!process.env.SUPABASE_KEY
    });
}
