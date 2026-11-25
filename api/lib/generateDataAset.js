export async function generateDataAset() {
    if (!process.env.SUPABASE_KEY) {
        throw new Error("Environment variable SUPABASE_KEY belum diatur");
    }

    const supabaseUrl =
        process.env.SUPABASE_URL || "https://zasjkgrmcvigblpyqsff.supabase.co";

    const headers = {
        apikey: process.env.SUPABASE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_KEY}`
    };

    // Ambil harga_emas dan investasi secara paralel
    const [hargaRes, investasiRes] = await Promise.all([
        fetch(
            `${supabaseUrl}/rest/v1/harga_emas?select=tanggal,harga_jual&order=tanggal.asc`,
            { headers }
        ),
        fetch(
            `${supabaseUrl}/rest/v1/investasi?select=tanggal_beli,biaya_pembelian,aset&order=tanggal_beli.asc`,
            { headers }
        )
    ]);

    const [hargaData, investasiData] = await Promise.all([
        hargaRes.json(),
        investasiRes.json()
    ]);

    if (!hargaRes.ok) {
        throw new Error(`Gagal mengambil harga_emas: ${JSON.stringify(hargaData)}`);
    }
    if (!investasiRes.ok) {
        throw new Error(`Gagal mengambil investasi: ${JSON.stringify(investasiData)}`);
    }

    const normalizeDate = (val) => (val ? String(val).trim().slice(0, 10) : "");

    const sortedHarga = (Array.isArray(hargaData) ? hargaData : [])
        .map((h) => ({
            tanggal: normalizeDate(h.tanggal),
            harga_jual: Number(h.harga_jual) || 0
        }))
        .filter((h) => h.tanggal)
        .sort((a, b) => a.tanggal.localeCompare(b.tanggal));

    const sortedInvestasi = (Array.isArray(investasiData) ? investasiData : [])
        .map((inv) => ({
            tanggal_beli: normalizeDate(inv.tanggal_beli),
            biaya_pembelian: Number(inv.biaya_pembelian) || 0,
            aset: Number(inv.aset) || 0
        }))
        .filter((inv) => inv.tanggal_beli)
        .sort((a, b) => a.tanggal_beli.localeCompare(b.tanggal_beli));

    if (!sortedHarga.length) {
        return {
            success: true,
            jumlah: 0,
            inserted: []
        };
    }

    let totalModal = 0;
    let totalAset = 0;
    let trxIndex = 0;

    const hasil = sortedHarga.map((h) => {
        // Akumulasi semua transaksi yang terjadi pada atau sebelum tanggal harga ini
        while (
            trxIndex < sortedInvestasi.length &&
            sortedInvestasi[trxIndex].tanggal_beli <= h.tanggal
        ) {
            totalModal = Math.round(totalModal + sortedInvestasi[trxIndex].biaya_pembelian);
            totalAset = Number((totalAset + sortedInvestasi[trxIndex].aset).toFixed(4));
            trxIndex++;
        }

        // Nilai aset di aplikasi (harga_jual per 0,01 gr * 100 = harga per 1 gr)
        const jumlah = Math.round(totalAset * (h.harga_jual * 100));

        // Selisih untung / rugi
        const untung = Math.round(jumlah - totalModal);

        return {
            tanggal_aset: h.tanggal,
            total_modal: totalModal,
            total_aset: totalAset,
            jumlah_uang_aplikasi: jumlah,
            untung_rugi: untung
        };
    });

    // Simpan ke tabel data_aset (Upsert per tanggal_aset)
    const insert = await fetch(
        `${supabaseUrl}/rest/v1/data_aset?on_conflict=tanggal_aset`,
        {
            method: "POST",
            headers: {
                ...headers,
                "Content-Type": "application/json",
                Prefer: "resolution=merge-duplicates,return=representation"
            },
            body: JSON.stringify(hasil)
        }
    );

    const rawInserted = await insert.text();
    let inserted = null;
    try {
        inserted = rawInserted ? JSON.parse(rawInserted) : null;
    } catch {
        inserted = rawInserted;
    }

    if (!insert.ok) {
        throw new Error(`Gagal menyimpan data_aset (${insert.status}): ${JSON.stringify(inserted)}`);
    }

    return {
        success: true,
        jumlah: hasil.length,
        inserted
    };
}
