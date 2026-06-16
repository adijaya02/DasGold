export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    try {

        const {
            tanggal_aset,
            total_modal,
            jumlah_uang_aplikasi,
            untung_rugi
        } = req.body;

        if (!tanggal_aset) {
            return res.status(400).json({
                error: "tanggal_aset wajib diisi"
            });
        }

        const response = await fetch(
            "https://zasjkgrmcvigblpyqsff.supabase.co/rest/v1/data_aset",
            {
                method: "POST",

                headers: {
                    apikey:
                        process.env.SUPABASE_KEY,

                    Authorization:
                        `Bearer ${process.env.SUPABASE_KEY}`,

                    "Content-Type":
                        "application/json",

                    Prefer:
                        "resolution=merge-duplicates"
                },

                body: JSON.stringify({

                    tanggal_aset,

                    total_modal:
                        Number(
                            total_modal
                        ) || 0,

                    jumlah_uang_aplikasi:
                        Number(
                            jumlah_uang_aplikasi
                        ) || 0,

                    untung_rugi:
                        Number(
                            untung_rugi
                        ) || 0

                })
            }
        );

        const data =
            await response.json();

        if (!response.ok) {

            return res.status(
                response.status
            ).json({
                error: data
            });

        }

        return res
            .status(200)
            .json({

                success: true,

                data

            });

    }

    catch (error) {

        return res
            .status(500)
            .json({

                error:
                    error.message

            });

    }

}
