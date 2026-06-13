export default async function handler(req, res) {
    try {
        const response = await fetch(
            "https://pegadaian.co.id/gold/prices/savings"
        );

        const data = await response.json();

        // contoh: di sini nanti kamu simpan ke database
        console.log("Harga Beli:", data.data.hargaBeli);
        console.log("Harga Jual:", data.data.hargaJual);

        res.status(200).json({
            success: true,
            hargaBeli: data.data.hargaBeli,
            hargaJual: data.data.hargaJual,
            tanggal: data.data.tglBerlaku
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
