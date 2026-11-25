export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    try {
        if (!process.env.SUPABASE_KEY) {
            throw new Error("Environment variable SUPABASE_KEY belum diatur");
        }

        const supabaseUrl =
            process.env.SUPABASE_URL || "https://zasjkgrmcvigblpyqsff.supabase.co";

        const headers = {
            apikey: process.env.SUPABASE_KEY,
            Authorization: `Bearer ${process.env.SUPABASE_KEY}`
        };

        // Ambil ketiga tabel secara paralel agar lebih cepat
        const [asetRes, hargaRes, investasiRes] = await Promise.all([
            fetch(
                `${supabaseUrl}/rest/v1/data_aset?select=tanggal_aset,total_modal,total_aset,jumlah_uang_aplikasi,untung_rugi&order=tanggal_aset.asc`,
                { headers }
            ),
            fetch(
                `${supabaseUrl}/rest/v1/harga_emas?select=tanggal,harga_beli,harga_jual&order=tanggal.asc`,
                { headers }
            ),
            fetch(
                `${supabaseUrl}/rest/v1/investasi?select=tanggal_beli,biaya_pembelian,aset&order=tanggal_beli.asc`,
                { headers }
            )
        ]);

        const [asetData, hargaData, investasiData] = await Promise.all([
            asetRes.json(),
            hargaRes.json(),
            investasiRes.json()
        ]);

        if (!asetRes.ok) {
            throw new Error(`Gagal mengambil data_aset: ${JSON.stringify(asetData)}`);
        }
        if (!hargaRes.ok) {
            throw new Error(`Gagal mengambil harga_emas: ${JSON.stringify(hargaData)}`);
        }
        if (!investasiRes.ok) {
            throw new Error(`Gagal mengambil investasi: ${JSON.stringify(investasiData)}`);
        }

        const normalizeDate = (val) => (val ? String(val).slice(0, 10) : "");

        // Mapping harga_emas berdasarkan tanggal (O(1) lookup)
        const hargaMap = new Map();
        (Array.isArray(hargaData) ? hargaData : []).forEach((h) => {
            const key = normalizeDate(h.tanggal);
            if (key) {
                hargaMap.set(key, {
                    harga_beli: Number(h.harga_beli) || 0,
                    harga_jual: Number(h.harga_jual) || 0
                });
            }
        });

        // Akumulasi investasi per tanggal (aman jika beli >1x dalam sehari)
        const investasiMap = new Map();
        (Array.isArray(investasiData) ? investasiData : []).forEach((inv) => {
            const key = normalizeDate(inv.tanggal_beli);
            if (!key) return;

            const prev = investasiMap.get(key) || { biaya_pembelian: 0, aset: 0 };
            investasiMap.set(key, {
                biaya_pembelian: prev.biaya_pembelian + (Number(inv.biaya_pembelian) || 0),
                aset: Number((prev.aset + (Number(inv.aset) || 0)).toFixed(4))
            });
        });

        // Gabungkan semua data
        const hasil = (Array.isArray(asetData) ? asetData : []).map((a) => {
            const key = normalizeDate(a.tanggal_aset);
            const h = hargaMap.get(key);
            const i = investasiMap.get(key);

            return {
                tanggal_aset: a.tanggal_aset,
                harga_beli: h?.harga_beli || 0,
                biaya_pembelian: i?.biaya_pembelian || 0,
                total_modal: Number(a.total_modal) || 0,
                aset: i?.aset || 0,
                total_aset: Number(a.total_aset) || 0,
                harga_jual: h?.harga_jual || 0,
                jumlah_uang_aplikasi: Number(a.jumlah_uang_aplikasi) || 0,
                untung_rugi: Number(a.untung_rugi) || 0
            };
        });

        return res.status(200).json(hasil);
    } catch (err) {
        console.error("ERROR /api/data-aset:", err);
        return res.status(500).json({
            error: err.message
        });
    }
}
