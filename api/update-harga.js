export default async function handler(req, res) {
    const response = await fetch(
        "https://pegadaian.co.id/gold/prices/savings"
    );

    const data = await response.json();

    await fetch(
        "https://zasjkgrmcvigblpyqsff.supabase.co/rest/v1/harga_emas",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                apikey: process.env.SUPABASE_KEY,
                Authorization: `Bearer ${process.env.SUPABASE_KEY}`,
                Prefer: "return=minimal"
            },
            body: JSON.stringify({
                harga_beli: data.data.hargaBeli,
                harga_jual: data.data.hargaJual,
                tanggal: data.data.tglBerlaku
            })
        }
    );

    res.json({ success: true });
}
