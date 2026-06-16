export default async function handler(req, res) {

try {

const headers = {

apikey:
process.env.SUPABASE_KEY,

Authorization:
`Bearer ${process.env.SUPABASE_KEY}`

};


// ambil data_aset
const aset =
await fetch(
"https://zasjkgrmcvigblpyqsff.supabase.co/rest/v1/data_aset?select=*&order=tanggal_aset.asc",
{
headers
}
);


// ambil harga emas
const harga =
await fetch(
"https://zasjkgrmcvigblpyqsff.supabase.co/rest/v1/harga_emas?select=*&order=tanggal.asc",
{
headers
}
);


// ambil investasi
const investasi =
await fetch(
"https://zasjkgrmcvigblpyqsff.supabase.co/rest/v1/investasi?select=*&order=tanggal_beli.asc",
{
headers
}
);


const asetData =
await aset.json();

const hargaData =
await harga.json();

const investasiData =
await investasi.json();


// gabungkan data
const hasil =

asetData.map(
(a)=>{

const h =

hargaData.find(
x =>
x.tanggal ===
a.tanggal_aset
);

const i =

investasiData.find(
x =>
x.tanggal_beli ===
a.tanggal_aset
);

return {

tanggal_aset:
a.tanggal_aset,

harga_beli:
h?.harga_beli || 0,

biaya_pembelian:
i?.biaya_pembelian || 0,

total_modal:
a.total_modal,

aset:
i?.aset || 0,

total_aset:
a.total_aset,

harga_jual:
h?.harga_jual || 0,

jumlah_uang_aplikasi:
a.jumlah_uang_aplikasi,

untung_rugi:
a.untung_rugi

};

}
);

return res
.status(200)
.json(
hasil
);

}

catch(err){

return res
.status(500)
.json({

error:
err.message

});

}

}
