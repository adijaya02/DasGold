export default async function handler(req, res) {

try {

const headers = {

apikey:
process.env.SUPABASE_KEY,

Authorization:
`Bearer ${process.env.SUPABASE_KEY}`

};


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


const hargaData =
await harga.json();

const investasiData =
await investasi.json();


let totalModal = 0;
let totalAset = 0;


const hasil =

hargaData.map((h)=>{

const trx =

investasiData.find(
i =>
i.tanggal_beli ===
h.tanggal
);


// kalau ada transaksi
if(trx){

totalModal +=
Number(
trx.biaya_pembelian
);

totalAset +=
Number(
trx.aset
);

}


// hitung nilai aplikasi
const jumlah =
totalAset *
(
Number(
h.harga_jual
) *
100
);


// hitung untung rugi
const untung =
jumlah -
totalModal;


return {

tanggal_aset:
h.tanggal,

total_modal:
totalModal,

jumlah_uang_aplikasi:
jumlah,

untung_rugi:
untung

};

});


// simpan ke data_aset
const insert =

await fetch(
"https://zasjkgrmcvigblpyqsff.supabase.co/rest/v1/data_aset?on_conflict=tanggal_aset",
{

method:"POST",

headers:{

...headers,

"Content-Type":
"application/json",

Prefer:
"resolution=merge-duplicates,return=representation"

},

body:
JSON.stringify(
hasil
)

}

);


const inserted =
await insert.json();


if(
!insert.ok
){

return res
.status(
insert.status
)
.json(
inserted
);

}


return res
.status(200)
.json({

success:true,

jumlah:
hasil.length,

inserted

});

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
