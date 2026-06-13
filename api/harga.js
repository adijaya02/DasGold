export default async function handler(req, res) {
    const response = await fetch(
        "https://zasjkgrmcvigblpyqsff.supabase.co/rest/v1/harga_emas?select=*&order=tanggal.desc&limit=1",
        {
            headers: {
                apikey: process.env.SUPABASE_KEY,
                Authorization: `Bearer ${process.env.SUPABASE_KEY}`
            }
        }
    );

    const data = await response.json();

    res.json(data[0]);
}
