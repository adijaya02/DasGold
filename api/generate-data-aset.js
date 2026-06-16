export default async function handler(req, res) {

try {

const headers = {
apikey:
process.env.SUPABASE_KEY,

Authorization:
`Bearer ${process.env.SUPABASE_KEY}`
};

const harga =
await fetch(
"https://zasjkgrmcvigblpyqsff.supabase.co/rest/v1/harga_emas?select=*",
{ headers }
);

const investasi =
await fetch(
"https://zasjkgrmcvigblpyqsff.supabase.co/rest/v1/investasi?select=*",
{ headers }
);

const hargaData =
await harga.json();

const investasiData =
await investasi.json();

let totalModal = 0;

const hasil =
hargaData.map((h)=>{

const trx =
investasiData.find(
i =>
i.tanggal_beli ===
h.tanggal
);

if(trx){

totalModal +=
Number(
trx.biaya_pembelian
);

}

const jumlah =
totalModal;

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

await fetch(
"https://zasjkgrmcvigblpyqsff.supabase.co/rest/v1/data_aset",

{

method:"POST",

headers:{

...headers,

"Content-Type":
"application/json",

Prefer:
"resolution=merge-duplicates"

},

body:
JSON.stringify(
hasil
)

}

);

res
.status(200)
.json({

success:true,

jumlah:
hasil.length

});

}

catch(err){

res
.status(500)
.json({
error:
err.message
});

}

}
