import { generateDataAset } from "./lib/generateDataAset.js";

export default async function handler(req, res) {

    try {

        const hasil = await generateDataAset();

        return res.status(200).json(hasil);

    } catch (err) {

        return res.status(500).json({
            error: err.message
        });

    }

}
