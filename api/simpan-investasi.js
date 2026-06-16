export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    try {

        const {
            biaya_pembelian,
            aset,
            tanggal_beli
        } = req.body;

        if (
            !biaya_pembelian ||
            !aset ||
            !tanggal_beli
        ) {
            return res.status(400).json({
                error: "Data tidak lengkap"
            });
        }

        const response = await fetch(
            "https://zasjkgrmcvigblpyqsff.supabase.co/rest/v1/investasi",
            {
                method: "POST",
                headers: {
                    apikey: process.env.SUPABASE_KEY,
                    Authorization:
                        `Bearer ${process.env.SUPABASE_KEY}`,
                    "Content-Type": "application/json",
                    Prefer: "return=representation"
                },

                body: JSON.stringify([
                    {
                        biaya_pembelian,
                        aset,
                        tanggal_beli
                    }
                ])
            }
        );

       const data =
        await response.json();
        
            console.log(
            "STATUS:",
            response.status
        );
        
            console.log(
            "SUPABASE:",
            data
        );
        
        if (!response.ok) {
        
            return res
            .status(
            response.status
        )
        .json({
        
            error:data
        
            });
        
        }

        return res.status(200).json(data);

    } catch (err) {

        return res.status(500).json({
            error: err.message
        });

    }

}
