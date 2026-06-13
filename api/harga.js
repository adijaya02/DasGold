export default async function handler(req, res) {
    try {
        const response = await fetch(
            "https://pegadaian.co.id/gold/prices/savings"
        );

        const data = await response.json();

        res.status(200).json({
            hargaBeli: data.data.hargaBeli,
            hargaJual: data.data.hargaJual,
            tanggal: data.data.tglBerlaku,
            naikBeli: data.data.isHargaBeliUp,
            naikJual: data.data.isHargaJualUp
        });

    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
}
